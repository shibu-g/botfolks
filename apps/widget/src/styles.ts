export const css = (color: string) => `
:host { all: initial; font-family: Inter, system-ui, -apple-system, sans-serif; }
* { box-sizing: border-box; }
.launcher { position: fixed; right: 20px; bottom: 20px; width: 56px; height: 56px; border-radius: 50%;
  background: ${color}; border: none; cursor: pointer; box-shadow: 0 6px 24px rgba(0,0,0,.25); z-index: 2147483000;
  display: grid; place-items: center; }
.launcher svg { width: 26px; height: 26px; fill: #fff; }
.panel { position: fixed; right: 20px; bottom: 88px; width: 370px; max-width: calc(100vw - 24px); height: 560px;
  max-height: calc(100vh - 110px); background: #fff; border-radius: 16px; box-shadow: 0 12px 48px rgba(0,0,0,.2);
  display: none; flex-direction: column; overflow: hidden; z-index: 2147483000; color: #111; }
.panel.open { display: flex; }
.head { background: ${color}; color: #fff; padding: 16px; font-weight: 700; font-size: 15px; }
.msgs { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 8px; background: #f7f7fb; }
.m { max-width: 85%; padding: 9px 12px; border-radius: 12px; font-size: 14px; line-height: 1.45; white-space: pre-wrap; word-wrap: break-word; }
.bot { background: #fff; border: 1px solid #e6e6ef; align-self: flex-start; }
.me { background: ${color}; color: #fff; align-self: flex-end; }
form { display: flex; gap: 8px; padding: 10px; border-top: 1px solid #eee; }
input { flex: 1; border: 1px solid #ddd; border-radius: 10px; padding: 10px; font: inherit; font-size: 14px; outline: none; }
button.send { background: ${color}; color: #fff; border: none; border-radius: 10px; padding: 0 14px; cursor: pointer; font-weight: 600; }
button.mic { background: #fff; border: 1px solid #ddd; border-radius: 10px; width: 40px; cursor: pointer; display: grid; place-items: center; flex-shrink: 0; }
button.mic svg { width: 18px; height: 18px; fill: #666; }
.brand { text-align: center; font-size: 11px; color: #999; padding: 0 0 8px; }
.brand a { color: #777; text-decoration: none; }
.call { position: absolute; inset: 0; background: #fff; display: none; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 24px; text-align: center; }
.call.active { display: flex; }
.call-orb { width: 72px; height: 72px; border-radius: 50%; background: ${color}; display: grid; place-items: center; }
.call-orb svg { width: 32px; height: 32px; fill: #fff; }
.call-orb.speaking { animation: pulse 1.1s ease-in-out infinite; }
@keyframes pulse { 0%,100% { box-shadow: 0 0 0 0 ${color}55; } 50% { box-shadow: 0 0 0 14px ${color}00; } }
.call-status { font-size: 13px; color: #888; font-weight: 600; }
.call-caption { font-size: 14px; color: #222; min-height: 40px; max-width: 280px; }
.call-end { background: #f04438; color: #fff; border: none; border-radius: 10px; padding: 10px 20px; cursor: pointer; font-weight: 600; }
`;
