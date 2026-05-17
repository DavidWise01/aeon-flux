# 0root.ai — ABD Law Engine · Rebuild

## -++- 1 Auto-Seed

This rebuild includes auto-seed. On first boot:
1. Checks if /mnt/data/kb is empty
2. If empty, copies /app/kb → /mnt/data/kb
3. Logs: "-++- 1: Seeded /mnt/data/kb from repo. Width enabled."

## Deploy

Railway → Root: . → Volume: /data → Domain: 0root.ai

No manual upload needed. The .zip seeds the volume automatically.

## Architecture

Same plane = -+1 (git push/pull)
Fractal below = -++- 1 (push down .01, save .99)

A reads anchor.md
B reads witness.md  
C synthesizes both
LAW checks consensus

## Change corpus

Edit files in /kb/ in repo and redeploy. Or edit /mnt/data/kb directly via Railway Data tab.
