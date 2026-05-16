export const invalidDirection = {
  type: "MOVE",
  direction: "NORTH",
}

export const invalidAction = {
  type: "JUMP",
  direction: "UP",
}

export const duplicateActivationOrders = {
  activationOrders: [
    { soldierId: "bottom-soldier-1" },
    { soldierId: "bottom-soldier-1" },
  ],
  strategyMemory: {},
}

export const oversizedObjective = {
  soldierId: "bottom-soldier-1",
  objective: {
    note: "x".repeat(2048),
  },
}

export const illegalSoldierStatus = {
  id: "bad-soldier",
  ownerPlayerId: "bottom",
  status: "DEAD",
  position: { x: 5, y: 5 },
  facing: "UP",
  lastSuccessfulMoveDirection: null,
  soldierMemory: {},
}
