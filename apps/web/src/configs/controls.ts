export type InputAction = 'gas' | 'brake' | 'tiltLeft' | 'tiltRight';

export const KEY_ACTIONS: Record<string, InputAction | undefined> = {
    ArrowRight: 'gas',
    KeyD: 'gas',
    ArrowUp: 'gas',
    KeyW: 'gas',
    ArrowLeft: 'brake',
    KeyA: 'brake',
    ArrowDown: 'brake',
    KeyS: 'brake',
    KeyQ: 'tiltLeft',
    KeyE: 'tiltRight',
};

export const PEDAL_LABELS: Record<InputAction, string> = {
    gas: 'Газ',
    brake: 'Тормоз и задний ход',
    tiltLeft: 'Наклон машины влево',
    tiltRight: 'Наклон машины вправо',
};
