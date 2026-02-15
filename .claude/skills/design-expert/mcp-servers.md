# Recommended MCP Servers for Design Workflow

These MCP servers connect to Claude Code and give it real design superpowers — Figma access,
browser screenshots, Tailwind intelligence, and more.

---

## 1. Figma MCP Server (Official)

**What it does**: Connects Claude Code directly to your Figma files. Pull design context,
variables, components, layout data, and generate code from Figma frames.

**Why it matters**: Instead of describing designs in words, point Claude at the actual Figma
file. It reads the design tokens, spacing, colors, and component structure directly.

**Setup (Remote — recommended)**:
```json
// In .claude/settings.json or ~/.claude/settings.json
{
  "mcpServers": {
    "figma": {
      "command": "npx",
      "args": ["-y", "figma-developer-mcp", "--stdio"],
      "env": {
        "FIGMA_API_KEY": "your-figma-api-key"
      }
    }
  }
}
```

Alternatively, use the remote endpoint (no local install):
- Remote URL: `https://mcp.figma.com/mcp`
- Requires Figma API key from Settings > Account > Personal Access Tokens

**Key capabilities**:
- Generate code from selected Figma frames
- Extract design variables (colors, spacing, typography tokens)
- Read component properties and variants
- Pull layout constraints and auto-layout settings
- Access Figma styles and local variables

**Docs**: https://developers.figma.com/docs/figma-mcp-server/

---

## 2. Figma Context MCP (Community — GLips)

**What it does**: Provides Figma layout information to AI coding agents. Focuses on giving
Claude the structural context of designs rather than pixel-perfect output.

**Why it matters**: Better for understanding design intent and hierarchy than the official
server in some cases. Excellent for translating Figma auto-layout to CSS Flexbox/Grid.

**Setup**:
```json
{
  "mcpServers": {
    "figma-context": {
      "command": "npx",
      "args": ["-y", "@anthropic/figma-context-mcp"],
      "env": {
        "FIGMA_API_KEY": "your-figma-api-key"
      }
    }
  }
}
```

**GitHub**: https://github.com/GLips/Figma-Context-MCP

---

## 3. Playwright MCP Server (Browser Screenshots)

**What it does**: Takes screenshots of your running app, captures specific elements, and
provides the accessibility tree of rendered pages. Claude can SEE what your site looks like.

**Why it matters**: This is the design feedback loop. Claude builds a component, takes a
screenshot, evaluates it against design requirements, and iterates. No more guessing.

**Setup**:
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-server-playwright"]
    }
  }
}
```

**Key capabilities**:
- Full page screenshots
- Element-specific screenshots (capture just a component)
- Accessibility tree inspection (semantic structure)
- Form interaction and state testing
- Multi-viewport screenshots (mobile, tablet, desktop)
- Visual diff comparisons

**Design workflow**:
1. Build component code
2. Take screenshot with Playwright MCP
3. Compare against Figma design (if Figma MCP is connected)
4. Iterate on differences

---

## 4. Puppeteer MCP Server

**What it does**: Browser automation via Puppeteer — screenshots, JavaScript execution,
page interaction, console monitoring.

**Setup**:
```json
{
  "mcpServers": {
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-server-puppeteer"]
    }
  }
}
```

**Key capabilities**:
- Navigate to URLs and take screenshots
- Click elements, fill forms, interact with UI
- Execute JavaScript in the browser context
- Monitor console logs for errors
- Configurable viewport sizes for responsive testing

**When to use**: Prefer Playwright MCP for most design work (better accessibility tree
support). Use Puppeteer when you need Chrome-specific behavior.

---

## 5. Tailwind CSS MCP Server

**What it does**: Provides Tailwind CSS utilities, documentation lookup, color palette
access, class conversion, and template generation directly in Claude's context.

**Why it matters**: Claude gets real-time access to the full Tailwind class system, can
generate proper color palettes from brand colors, and audit existing HTML for accessibility.

**Setup**:
```json
{
  "mcpServers": {
    "tailwindcss": {
      "command": "npx",
      "args": ["-y", "tailwindcss-mcp-server"]
    }
  }
}
```

**Key capabilities**:
- Access complete Tailwind color palette with all shades
- Generate custom color palettes from brand colors
- Convert between CSS and Tailwind classes
- Generate component templates (buttons, cards, forms, nav)
- Audit HTML for accessibility, responsiveness, and performance
- Create complete theme configs (spacing, shadows, borders)

---

## 6. Screenshot MCP Server (sethbang)

**What it does**: Dual-purpose screenshot tool — captures web pages via Puppeteer AND
system screenshots using native OS tools. Can capture your entire screen.

**Why it matters**: When you need to show Claude what your desktop looks like, or compare
your browser output side-by-side with a design mockup.

**Setup**:
```json
{
  "mcpServers": {
    "screenshot": {
      "command": "npx",
      "args": ["-y", "mcp-screenshot-server"]
    }
  }
}
```

**GitHub**: https://github.com/sethbang/mcp-screenshot-server

---

## 7. DaisyUI + Tailwind MCP (Blueprint)

**What it does**: Provides DaisyUI component documentation and Tailwind integration for
generating accessible, pre-styled components.

**Why it matters**: DaisyUI provides semantic component classes that are inherently more
accessible than raw Tailwind. Good for rapid prototyping.

**Docs**: https://daisyui.com/blueprint/

---

## Recommended Setup for LeadBotStudio

For maximum design capability, install these three:

### Priority 1: Playwright (Browser Screenshots)
See your work in real-time. Essential for design iteration.

### Priority 2: Figma MCP (Official)
Connect designs directly to code generation. Essential if you use Figma.

### Priority 3: Tailwind CSS MCP
Color palette generation, class optimization, accessibility auditing.

### Combined config:
```json
{
  "mcpServers": {
    "figma": {
      "command": "npx",
      "args": ["-y", "figma-developer-mcp", "--stdio"],
      "env": {
        "FIGMA_API_KEY": "your-figma-api-key"
      }
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-server-playwright"]
    },
    "tailwindcss": {
      "command": "npx",
      "args": ["-y", "tailwindcss-mcp-server"]
    }
  }
}
```

Place this in `/Users/muftau/Documents/programming/leadbotstudio/.claude/settings.json`
for project-level config, or `~/.claude/settings.json` for global access.
