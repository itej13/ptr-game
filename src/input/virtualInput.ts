/**
 * Shared virtual input state — written by TouchControls, read by Player + zones.
 * Held buttons (left/right/up) are read every frame.
 * One-shot actions (space, r) are consumed once per press.
 */
export const virtualInput = {
  /** Held movement — read every frame by Player.ts */
  left: false,
  right: false,

  /** One-shot signals — consumed once per press */
  _upJust: false,
  _leftJust: false,
  _rightJust: false,
  _spaceJust: false,
  _rJust: false,

  pressLeft()  { this.left = true;  this._leftJust = true },
  releaseLeft(){ this.left = false },
  pressRight() { this.right = true; this._rightJust = true },
  releaseRight(){ this.right = false },
  pressUp()    { this._upJust = true },
  pressSpace() { this._spaceJust = true },
  pressR()     { this._rJust = true },

  consumeLeft(): boolean {
    const v = this._leftJust
    this._leftJust = false
    return v
  },
  consumeRight(): boolean {
    const v = this._rightJust
    this._rightJust = false
    return v
  },
  consumeUp(): boolean {
    const v = this._upJust
    this._upJust = false
    return v
  },
  consumeSpace(): boolean {
    const v = this._spaceJust
    this._spaceJust = false
    return v
  },
  consumeR(): boolean {
    const v = this._rJust
    this._rJust = false
    return v
  },
}
