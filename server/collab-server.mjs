import { WebSocketServer } from 'ws'

const PORT = Number(process.env.PORT || 1235)
const HOST = process.env.HOST || '127.0.0.1'

const COLOR_PALETTE = [
  '#f4a8a8',
  '#f7c79d',
  '#f2df8f',
  '#b8e0a5',
  '#98dbc6',
  '#8fc7ff',
  '#b9b0ff',
  '#e0b2ff',
  '#ffb7d4',
  '#d8c3a5',
]

const rooms = new Map()

function send(ws, payload) {
  if (ws.readyState === 1) {
    ws.send(JSON.stringify(payload))
  }
}

function getParticipantList(room) {
  const participants = []
  if (room.host) {
    participants.push({
      id: room.host.profile.id,
      name: room.host.profile.name,
      color: room.host.profile.color,
      isHost: true,
      pointer: room.host.pointer,
    })
  }
  for (const guest of room.guests.values()) {
    participants.push({
      id: guest.profile.id,
      name: guest.profile.name,
      color: guest.profile.color,
      isHost: false,
      pointer: guest.pointer,
    })
  }
  return participants
}

function getPendingList(room) {
  return [...room.pending.values()].map(guest => ({
    id: guest.profile.id,
    name: guest.profile.name,
    color: guest.profile.color,
  }))
}

function broadcastState(room) {
  const payload = {
    type: 'collaboration-state',
    roomId: room.id,
    participants: getParticipantList(room),
    pendingRequests: getPendingList(room),
  }
  if (room.host) send(room.host.ws, payload)
  for (const guest of room.guests.values()) send(guest.ws, payload)
}

function broadcastWorkspace(room, actorId) {
  const payload = {
    type: 'workspace',
    roomId: room.id,
    workspace: room.workspace,
    actorId,
  }
  if (room.host) send(room.host.ws, payload)
  for (const guest of room.guests.values()) send(guest.ws, payload)
}

function broadcastPointer(room, participantId, pointer) {
  const payload = {
    type: 'pointer-state',
    roomId: room.id,
    participantId,
    pointer,
  }
  if (room.host) send(room.host.ws, payload)
  for (const guest of room.guests.values()) send(guest.ws, payload)
}

function assignColor(room) {
  const used = new Set([
    ...(room.host ? [room.host.profile.color] : []),
    ...[...room.guests.values()].map(guest => guest.profile.color),
    ...[...room.pending.values()].map(guest => guest.profile.color),
  ])
  return COLOR_PALETTE.find(color => !used.has(color)) ?? COLOR_PALETTE[(room.guests.size + room.pending.size) % COLOR_PALETTE.length]
}

function removeSocketFromRoom(ws) {
  const roomId = ws.meta?.roomId
  const clientId = ws.meta?.clientId
  if (!roomId || !clientId) return
  const room = rooms.get(roomId)
  if (!room) return

  if (room.host?.profile.id === clientId) {
    for (const guest of room.guests.values()) send(guest.ws, { type: 'room-closed' })
    for (const guest of room.pending.values()) send(guest.ws, { type: 'room-closed' })
    rooms.delete(roomId)
    return
  }

  if (room.pending.delete(clientId)) {
    broadcastState(room)
  }

  if (room.guests.delete(clientId)) {
    broadcastState(room)
  }

  if (!room.host && room.guests.size === 0 && room.pending.size === 0) {
    rooms.delete(roomId)
  }
}

const wss = new WebSocketServer({ port: PORT, host: HOST })

wss.on('connection', (ws) => {
  ws.meta = { roomId: null, clientId: null }

  ws.on('message', (raw) => {
    let message
    try {
      message = JSON.parse(raw.toString())
    } catch {
      send(ws, { type: 'error', message: 'Invalid collaboration payload' })
      return
    }

    if (message.type === 'host-open') {
      const existing = rooms.get(message.roomId)
      if (existing?.host) {
        send(ws, { type: 'error', message: 'This collaboration room already exists' })
        return
      }
      const room = {
        id: message.roomId,
        workspace: message.workspace,
        host: {
          ws,
          profile: {
            ...message.profile,
            color: COLOR_PALETTE[0],
          },
          pointer: null,
        },
        guests: new Map(),
        pending: new Map(),
      }
      rooms.set(message.roomId, room)
      ws.meta = { roomId: message.roomId, clientId: message.profile.id }
      send(ws, {
        type: 'session-started',
        roomId: room.id,
        participants: getParticipantList(room),
        pendingRequests: [],
      })
      return
    }

    const room = rooms.get(message.roomId)
    if (!room) {
      send(ws, { type: 'error', message: 'Collaboration room not found' })
      return
    }

    if (message.type === 'guest-request') {
      if (room.pending.has(message.profile.id) || room.guests.has(message.profile.id) || room.host?.profile.id === message.profile.id) {
        send(ws, { type: 'join-requested', roomId: room.id })
        return
      }
      const pending = {
        ws,
        profile: {
          ...message.profile,
          color: assignColor(room),
        },
      }
      room.pending.set(message.profile.id, pending)
      ws.meta = { roomId: room.id, clientId: message.profile.id }
      send(ws, { type: 'join-requested', roomId: room.id })
      broadcastState(room)
      return
    }

    const isHost = room.host?.profile.id === ws.meta?.clientId

    if (message.type === 'approve-guest') {
      if (!isHost) return
      const pending = room.pending.get(message.guestId)
      if (!pending) return
      room.pending.delete(message.guestId)
      room.guests.set(message.guestId, {
        ...pending,
        pointer: null,
      })
      send(pending.ws, {
        type: 'approved',
        roomId: room.id,
        workspace: room.workspace,
        participants: getParticipantList(room),
        pendingRequests: getPendingList(room),
      })
      broadcastState(room)
      return
    }

    if (message.type === 'reject-guest') {
      if (!isHost) return
      const pending = room.pending.get(message.guestId)
      if (!pending) return
      room.pending.delete(message.guestId)
      send(pending.ws, { type: 'rejected' })
      broadcastState(room)
      return
    }

    if (message.type === 'kick-guest') {
      if (!isHost) return
      const guest = room.guests.get(message.guestId) ?? room.pending.get(message.guestId)
      if (!guest) return
      room.guests.delete(message.guestId)
      room.pending.delete(message.guestId)
      send(guest.ws, { type: 'kicked' })
      broadcastState(room)
      return
    }

    if (message.type === 'close-room') {
      if (!isHost) return
      for (const guest of room.guests.values()) send(guest.ws, { type: 'room-closed' })
      for (const guest of room.pending.values()) send(guest.ws, { type: 'room-closed' })
      rooms.delete(room.id)
      return
    }

    if (message.type === 'leave-room') {
      room.pending.delete(ws.meta.clientId)
      room.guests.delete(ws.meta.clientId)
      broadcastState(room)
      return
    }

    if (message.type === 'workspace-update') {
      if (!isHost && !room.guests.has(ws.meta.clientId)) return
      room.workspace = message.workspace
      broadcastWorkspace(room, ws.meta.clientId)
      return
    }

    if (message.type === 'pointer-update') {
      if (isHost && room.host) {
        room.host.pointer = message.pointer
        broadcastPointer(room, room.host.profile.id, message.pointer)
        return
      }
      const guest = room.guests.get(ws.meta.clientId)
      if (!guest) return
      guest.pointer = message.pointer
      broadcastPointer(room, guest.profile.id, message.pointer)
    }
  })

  ws.on('close', () => {
    removeSocketFromRoom(ws)
  })
})

wss.on('listening', () => {
  console.log(`Thot collaboration server listening on ws://${HOST}:${PORT}`)
})
