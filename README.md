# HyDeclare Editor

HyDeclare is a browser-based graphical editor for hybrid declarative process specifications.

![Screenshot of HyDeclare](screen.png)

You model hybrid constraints over discrete task events and continuous sensor signals, and the editor compiles them to Signal Temporal Logic (STL) formulas and Esper EPL rules for real-time monitoring and enforcement. The canvas uses React Flow (`@xyflow/react`) for layout and interaction.

## Quick start

You can run the editor locally with `npm` or `pnpm`. The repository workspace is configured for `pnpm`.

### 1. Run locally

```bash
# Install dependencies
pnpm install # or: npm install

# Start the dev server
pnpm dev     # or: npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Docker deployment

To run the editor in a container:

```bash
docker compose up -d
```

## Model JSON format

HyDeclare stores models as plain JSON:

```jsonc
{
  "signals":    [{ "id": "s1", "name": "Temp", "x": 80, "y": 140 }],
  "ports":      [{ "id": "p1", "signal": "s1", "op": ">", "k": 90, "delta": 10 }],
  "junctions":  [{ "id": "j1", "op": "AND", "members": ["p1", "p2"], "delta": 5, "x": 330, "y": 150 }],
  "activities": [{ "id": "a1", "name": "EmergencyStop", "x": 540, "y": 128 }],
  "constraints": [{ "id": "Ξ₁", "type": "Response", "theta1": "j1", "theta2": "a1", "Ia": [0,"m"], "Ir": [0,3] }]
}
```
