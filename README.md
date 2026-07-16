# HyDeclare Editor

A browser-based graphical editor for **hybrid declarative process specifications**. 

![Screenshot of HyDeclare](screen.png)

This editor allows you to model hybrid constraints over discrete task events and continuous sensor signals, compiling them to **Signal Temporal Logic (STL) formulas** and **Esper EPL rules** for real-time monitoring and enforcement.

The canvas is built on **React Flow** (`@xyflow/react`) for layout and interactivity.

## Quick Start

You can run the editor locally using either `npm` or `pnpm` (which is configured in the repository workspace).

### 1. Run Locally

```bash
# Install dependencies
pnpm install # or: npm install

# Start the dev server
pnpm dev     # or: npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Docker Deployment

Deploy in containerized environment:

```bash
docker compose up -d
```



## Model JSON Format

HyDeclare models are stored as plain JSON:

```jsonc
{
  "signals":    [{ "id": "s1", "name": "Temp", "x": 80, "y": 140 }],
  "ports":      [{ "id": "p1", "signal": "s1", "op": ">", "k": 90, "delta": 10 }],
  "junctions":  [{ "id": "j1", "op": "AND", "members": ["p1"], "delta": 5, "x": 330, "y": 150 }],
  "activities": [{ "id": "a1", "name": "EmergencyStop", "x": 540, "y": 128 }],
  "constraints": [{ "id": "Ξ₁", "type": "Response", "theta1": "j1", "theta2": "a1", "Ia": [0,"m"], "Ir": [0,3] }]
}
```