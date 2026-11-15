// Plain shared state. No imports, so any module can read it without creating
// an import cycle.
export const game = { started: false, time: 0 };
// On-screen caption (greetings, the player's mumbling).
export const caption = { text: '', t: 0 };
// Day/night: T is the target (0 night, 1 day), K the current blend,
// dk the eased blend and lampOn how lit the street lamps are (1 at night).
export const day = { T: 0, K: 0, dk: 0, lampOn: 1 };
