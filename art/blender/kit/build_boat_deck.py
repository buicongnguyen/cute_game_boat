"""Cute Game Boat: the home deck kit and the cabin hatch, in the chunky toy style of the kit (style.py).

The first boat pass drew the deck's fence and gates with the village's garden pickets and borrowed Cloudback's round
hatch; the home pond was a flat sand rectangle. This generator replaces them with boat pieces in warm, saturated flat
colours: white-painted posts with red bands and brass caps, thick rope rails over a teal toe board, mast-post gates with
an anchor sign and bunting, a timber-framed pond with brass-capped bollards, deck cargo for the corners, and a teal
companionway hatch with a planked lid and a porthole.

Two files (Blender Z up / -Y front; glTF Y up / +Z front; metres; origin at the ground centre):

`boat-deck.glb` is a kit (src/assets.ts `boatDeckKit`, one top-level object per model):
- `rail`        one 2 m deck rail segment along X: a post at x = -1 (segments share it), rope at z 0.52 and 0.92 to
                x = +1, a teal toe board. Placed 80 times (boat-deck.ts `deckFurniture`), so keep it light (<= 200 tris).
- `rail_post`   the post alone, for the corners and gate sides.
- `boat_gate`   posts at x = +-1.7, 3.1 m high, an arched anchor sign, bunting and a life ring (<= 1,900; four copies).
- `deck_cargo`  a corner group: two crates, a barrel, a rope coil and a life-ring stand, about 2.4 x 2.4 m (<= 1,600).
- `deck_lantern` a short lantern post with a glowing lamp (<= 260).
- `harpoon`     the combat harpoon, held and thrown (src/harpoon-art.ts): along glTF +Z, tip at z 0.7, butt at
                z -0.63, the same length as the old 84-triangle box fork (<= 240).
- `pond_frame`  the timber kerb round the home pond's water (8 x 5.8 m, src/pond-shape.ts HOME_POND): planks with tone
                variation and a white cap, a teal lining and floor under the water, corner bollards, a ladder and a ring
                (<= 3,000; one copy). Its top is z 0.34, just above the water at 0.30.

`boat-hatch.glb` (REFINED_ASSET_FILES.hatch): root `hatch` with the coaming, lantern and life ring, and child `door`
whose origin is the lid's rear hinge (glTF y 0.34, z -0.86); the game opens it with door.rotation.x = -1.9. Footprint
1.7 x 1.7 m before HATCH_SCALE (1.8), so the obstacle (r 1.7 m in the world) still covers it. <= 3,000 triangles.

Run from the repository root:

    blender -b --factory-startup --python art/blender/kit/build_boat_deck.py -- [--install] [--render]

--install copies both GLBs to public/assets/models/ (then run `npm run art:compress`); --render writes
art/previews/kit/boat-deck.webp, boat-hatch.webp and boat-pond.webp. Exits non-zero over any budget.
"""
import bpy
import bmesh
import json
import math
import os
import random
import shutil
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)
from style import box, cyl, sphere, torus, lathe, mat, join, triangles, reset_scene, studio, render, extrude_outline, _mesh_object  # noqa: E402
from mathutils import Vector  # noqa: E402

REPO = os.path.normpath(os.path.join(HERE, '..', '..', '..'))
GEN = os.path.join(REPO, 'art', 'generated', 'kit')
OUT_KIT = os.path.join(GEN, 'models', 'boat-deck.glb')
OUT_HATCH = os.path.join(GEN, 'models', 'boat-hatch.glb')
MANIFEST = os.path.join(GEN, 'boat-deck-manifest.json')
PREVIEWS = os.path.join(REPO, 'art', 'previews', 'kit')
PUBLIC = os.path.join(REPO, 'public', 'assets', 'models')
BUDGET = {'rail': 200, 'rail_post': 100, 'boat_gate': 1900, 'deck_cargo': 1600, 'deck_lantern': 260, 'pond_frame': 3000, 'hatch': 3000, 'harpoon': 240}
POND = (4.0, 2.9)       # water half extents (HOME_POND.rx, rz)
KERB = 0.45             # kerb width outside the water line (the old sand bank's margin)
TOP = 0.34              # kerb top; the water surface is 0.30


def materials():
    """Flat toon colours. Names are the runtime's tint/merge keys; keep them."""
    return dict(
        paint=mat('Boat paint white', '#FFF6E6', 0.5),
        red=mat('Boat paint red', '#EE3B3B', 0.45),
        teal=mat('Boat paint teal', '#13A9BE', 0.45),
        navy=mat('Boat paint navy', '#24479B', 0.45),
        brass=mat('Boat brass', '#FFC23A', 0.3, 0.35),
        rope=mat('Boat rope', '#F0BE6A', 0.7),
        rope_dark=mat('Boat rope dark', '#C98A3C', 0.7),
        plank_a=mat('Boat plank A', '#E59A4E', 0.6),
        plank_b=mat('Boat plank B', '#C9783A', 0.6),
        plank_c=mat('Boat plank C', '#F2B66A', 0.6),
        plank_dark=mat('Boat plank dark', '#8E4F27', 0.65),
        iron=mat('Boat iron', '#3F4A66', 0.4, 0.3),
        hole=mat('Boat hold', '#1B2140', 0.9),
        glass=mat('Boat glass', '#7FE3FF', 0.15),
        lining=mat('Boat pool lining', '#1597B8', 0.5),
        floor=mat('Boat pool floor', '#3EC3D9', 0.5),
        sand=mat('Boat pool sand', '#F5DE9A', 0.7),
        flag_y=mat('Boat flag yellow', '#FFD23F', 0.5),
        flag_b=mat('Boat flag blue', '#2E9BF0', 0.5),
        # A plain bright lamp, not emissive: it merges into the one baked draw with the rest of the model.
        glow=mat('Boat lantern glass', '#FFE36B', 0.4),
    )


def tube(name, points, radius, material, sides=5):
    """A rope: rings of `sides` vertices along `points`, open ended (the ends hide in posts)."""
    bm = bmesh.new()
    rings = []
    for i, p in enumerate(points):
        p = Vector(p)
        a = Vector(points[max(i - 1, 0)]); b = Vector(points[min(i + 1, len(points) - 1)])
        t = (b - a).normalized()
        side = t.cross(Vector((0, 0, 1)))
        if side.length < 1e-4:
            side = Vector((1, 0, 0))
        side.normalize()
        up = side.cross(t).normalized()
        rings.append([bm.verts.new(p + (side * math.cos(k * math.tau / sides) + up * math.sin(k * math.tau / sides)) * radius) for k in range(sides)])
    for r0, r1 in zip(rings, rings[1:]):
        for k in range(sides):
            bm.faces.new((r0[k], r0[(k + 1) % sides], r1[(k + 1) % sides], r1[k]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    obj = _mesh_object(name, bm, material)
    for poly in obj.data.polygons:
        poly.use_smooth = True
    return obj


def swag(x0, x1, z, sag, y=0.0, steps=6):
    return [(x0 + (x1 - x0) * i / steps, y, z - sag * (1 - (2 * i / steps - 1) ** 2)) for i in range(steps + 1)]


def post(m, x=0.0, y=0.0, h=1.08, r=0.1, name='post'):
    """White post, red band, brass dome cap. 8 sides, no bevel: it is drawn ~90 times."""
    return [
        cyl(f'{name}-shaft', r, h, (x, y, h / 2), m['paint'], verts=8, bev=0, seg=1),
        cyl(f'{name}-band', r + 0.012, 0.12, (x, y, h - 0.28), m['red'], verts=8, bev=0, seg=1),
        lathe(f'{name}-cap', [(r + 0.025, h - 0.01), (r * 0.7, h + 0.1), (0, h + 0.13)], loc=(x, y, 0), material=m['brass'], segments=8, cap_bottom=False),
    ]


def ring_buoy(m, name, loc, rot, major=0.3, minor=0.085):
    """Red and white life ring in four quarters (two materials)."""
    parts = []
    for q in range(4):
        bm = bmesh.new()
        segs, minor_segs = 5, 6
        verts = []
        for i in range(segs + 1):
            a = (q + i / segs) * math.tau / 4
            ring = []
            for j in range(minor_segs):
                b = j * math.tau / minor_segs
                rr = major + minor * math.cos(b)
                ring.append(bm.verts.new((rr * math.cos(a), rr * math.sin(a), minor * math.sin(b))))
            verts.append(ring)
        for i in range(segs):
            for j in range(minor_segs):
                bm.faces.new((verts[i][j], verts[i + 1][j], verts[i + 1][(j + 1) % minor_segs], verts[i][(j + 1) % minor_segs]))
        obj = _mesh_object(f'{name}-q{q}', bm, m['red'] if q % 2 == 0 else m['paint'])
        for poly in obj.data.polygons:
            poly.use_smooth = True
        obj.location, obj.rotation_euler = loc, rot
        parts.append(obj)
    return parts


# ------------------------------------------------------------------ deck kit
def build_rail(m):
    parts = post(m, -1.0)
    parts.append(tube('rope-top', swag(-1.0, 1.0, 0.92, 0.12, steps=4), 0.045, m['rope'], sides=4))
    parts.append(tube('rope-low', swag(-1.0, 1.0, 0.52, 0.08, steps=4), 0.038, m['rope_dark'], sides=4))
    parts.append(box('toe-board', (2.0, 0.1, 0.14), (0, 0, 0.07), m['teal'], bev=0))
    return join(parts, 'rail')


def build_rail_post(m):
    return join(post(m, 0.0) + [box('toe-foot', (0.26, 0.14, 0.14), (0, 0, 0.07), m['teal'], bev=0)], 'rail_post')


def build_gate(m):
    parts = []
    for x in (-1.7, 1.7):
        parts += post(m, x, h=3.0, r=0.15, name=f'gate-post{x}')
        parts.append(cyl(f'gate-band-low{x}', 0.165, 0.14, (x, 0, 0.45), m['red'], verts=8, bev=0, seg=1))
        parts.append(cyl(f'gate-foot{x}', 0.24, 0.16, (x, 0, 0.08), m['teal'], verts=8, bev=0.02, seg=1))
    # Arched sign: a navy board with a brass edge, the anchor in brass on its face.
    arc = [(-1.95 + 3.9 * i / 12, 2.55 + 0.32 * math.sin(math.pi * i / 12)) for i in range(13)]
    outline = arc + [(x, z + 0.52) for x, z in reversed(arc)]
    parts.append(extrude_outline('gate-board', [(x, z) for x, z in outline], 0.12, material=m['navy'], bev=0.025))
    edge = [(x, z - 0.05) for x, z in arc] + [(x, z + 0.04) for x, z in reversed(arc)]
    parts.append(extrude_outline('gate-board-edge', edge, 0.16, material=m['brass'], bev=0.01))
    face = -0.075
    parts += [
        torus('anchor-eye', 0.07, 0.022, (0, face, 3.22), m['brass'], major_segs=10, minor_segs=4, rot=(math.radians(90), 0, 0)),
        box('anchor-shank', (0.06, 0.04, 0.42), (0, face, 2.97), m['brass'], bev=0.01, seg=1),
        box('anchor-stock', (0.3, 0.04, 0.06), (0, face, 3.1), m['brass'], bev=0.01, seg=1),
    ]
    arms = [(0.2 * math.cos(math.radians(a)), 2.83 + 0.2 * math.sin(math.radians(a))) for a in range(200, 341, 20)]
    parts.append(tube('anchor-arms', [(x, face, z) for x, z in arms], 0.03, m['brass'], sides=4))
    for s in (-1, 1):
        parts.append(lathe(f'anchor-fluke{s}', [(0.05, 0), (0, 0.11)], loc=(s * 0.2 * math.cos(math.radians(20)), face, 2.83 - 0.07), material=m['brass'], segments=4, rot=(0, math.radians(-s * 35), 0)))
    # Bunting under the sign: a rope swag with seven pennants in warm, alternating colours.
    rope = swag(-1.6, 1.6, 2.35, 0.32, -0.02, steps=8)
    parts.append(tube('bunting-rope', rope, 0.018, m['rope_dark'], sides=4))
    flags = (m['red'], m['flag_y'], m['flag_b'], m['paint'], m['red'], m['flag_y'], m['flag_b'])
    for i, fm in enumerate(flags):
        t = (i + 1) / 8
        x = -1.6 + 3.2 * t
        z = 2.35 - 0.32 * (1 - (2 * t - 1) ** 2)
        parts.append(extrude_outline(f'pennant{i}', [(x - 0.15, z), (x + 0.15, z), (x, z - 0.34)], 0.02, loc=(0, -0.02, 0), material=fm, bev=0))
    parts += ring_buoy(m, 'gate-ring', (1.7, -0.26, 1.45), (math.radians(90), 0, 0), major=0.27, minor=0.075)
    return join(parts, 'boat_gate')


def crate(m, name, loc, size=0.7, turn=0.0):
    x, y, z = loc
    s = size
    parts = [box(f'{name}-body', (s, s, s), (x, y, z + s / 2), m['plank_a'], bev=0.03, seg=1, rot=(0, 0, turn))]
    # Darker frame boards on the front and side faces read as slats from the game camera.
    c, sn = math.cos(turn), math.sin(turn)
    for dz in (0.1, s - 0.1):
        parts.append(box(f'{name}-band{dz}', (s + 0.03, s + 0.03, 0.1), (x, y, z + dz), m['plank_dark'], bev=0, rot=(0, 0, turn)))
    parts.append(box(f'{name}-cross', (s * 1.2, 0.04, 0.09), (x + sn * (s / 2 + 0.01), y - c * (s / 2 + 0.01), z + s / 2), m['plank_dark'], bev=0, rot=(0, math.radians(45), turn)))
    for dx in (-s / 2, s / 2):
        parts.append(box(f'{name}-edge{dx}', (0.1, s + 0.03, s - 0.1), (x + c * dx, y + sn * dx, z + s / 2), m['plank_dark'], bev=0, rot=(0, 0, turn)))
    return parts


def build_cargo(m):
    parts = []
    parts += crate(m, 'crate1', (0.55, 0.45, 0), 0.78, 0.15)
    parts += crate(m, 'crate2', (0.5, 0.42, 0.78), 0.58, -0.2)
    parts += crate(m, 'crate3', (-0.35, 0.75, 0), 0.6, 0.6)
    # Barrel: a lathe with two brass hoops.
    prof = [(0.28, 0), (0.33, 0.12), (0.36, 0.42), (0.33, 0.72), (0.28, 0.84)]
    parts.append(lathe('barrel', prof, loc=(-0.65, -0.35, 0), material=m['plank_b'], segments=12))
    for z, r in ((0.16, 0.345), (0.68, 0.345)):
        parts.append(cyl(f'hoop{z}', r, 0.06, (-0.65, -0.35, z), m['brass'], verts=12, bev=0, seg=1))
    parts.append(cyl('barrel-lid', 0.27, 0.03, (-0.65, -0.35, 0.845), m['plank_dark'], verts=12, bev=0, seg=1))
    # Rope coil on the deck.
    for i, (r, z) in enumerate(((0.3, 0.05), (0.22, 0.13), (0.14, 0.2))):
        parts.append(torus(f'coil{i}', r, 0.05, (0.35, -0.6, z), m['rope'], major_segs=12, minor_segs=4))
    # Life-ring stand: a short white post with the ring hung on it, facing the camera.
    parts += post(m, -0.95, 0.55, h=1.15, r=0.07, name='stand')
    parts += ring_buoy(m, 'stand-ring', (-0.95, 0.42, 0.72), (math.radians(90), 0, 0), major=0.26, minor=0.07)
    return join(parts, 'deck_cargo')


def build_lantern(m):
    parts = post(m, 0, h=1.35, r=0.07, name='lantern-post')
    parts += [
        box('lantern-arm', (0.36, 0.05, 0.05), (0.16, 0, 1.38), m['iron'], bev=0.01, seg=1),
        lathe('lantern-roof', [(0.13, 1.18), (0.03, 1.32)], loc=(0.32, 0, 0), material=m['red'], segments=6, cap_bottom=True),
        cyl('lantern-glass', 0.09, 0.2, (0.32, 0, 1.06), m['glow'], verts=6, bev=0, seg=1),
        cyl('lantern-base', 0.11, 0.04, (0.32, 0, 0.94), m['iron'], verts=6, bev=0, seg=1),
    ]
    return join(parts, 'deck_lantern')


def build_pond_frame(m):
    rng = random.Random(7)
    rx, rz = POND
    parts = []
    tones = (m['plank_a'], m['plank_b'], m['plank_c'])
    # Kerb boards run along each side in two rows with staggered joints and three warm tones, like a real deck edge.
    def side(x0, x1, y, along_x):
        for row in (0, 1):
            off = (row - 0.5) * KERB / 2
            cuts = [x0]
            pos = x0 + (0.8 if row else 1.5)
            while pos < x1 - 0.6:
                cuts.append(pos); pos += 1.7 + rng.random() * 0.6
            cuts.append(x1)
            for a, b in zip(cuts, cuts[1:]):
                c = (a + b) / 2
                loc = (c, y + off, TOP - 0.06) if along_x else (y + off, c, TOP - 0.06)
                size = (b - a - 0.04, KERB / 2 - 0.03, 0.12) if along_x else (KERB / 2 - 0.03, b - a - 0.04, 0.12)
                parts.append(box(f'kerb{len(parts)}', size, loc, tones[rng.randrange(3)], bev=0.02, seg=1))
    side(-rx - KERB, rx + KERB, -(rz + KERB / 2), True)
    side(-rx - KERB, rx + KERB, rz + KERB / 2, True)
    side(-rz, rz, -(rx + KERB / 2), False)
    side(-rz, rz, rx + KERB / 2, False)
    # Under the planks: a dark timber skirt down to the deck, and the teal lining and floor of the pool.
    ox, oy = rx + KERB, rz + KERB
    for (sx, sy, lx, ly) in ((2 * ox, 0.06, 0, -oy + 0.03), (2 * ox, 0.06, 0, oy - 0.03), (0.06, 2 * oy, -ox + 0.03, 0), (0.06, 2 * oy, ox - 0.03, 0)):
        parts.append(box(f'skirt{lx}{ly}', (sx, sy, TOP - 0.12), (lx, ly, (TOP - 0.12) / 2), m['plank_dark'], bev=0))
    # A white-painted cap along the outer edge (the "gunwale"), a teal lining band at the water line.
    for (sx, sy, lx, ly) in ((2 * ox + 0.08, 0.1, 0, -oy), (2 * ox + 0.08, 0.1, 0, oy), (0.1, 2 * oy, -ox, 0), (0.1, 2 * oy, ox, 0)):
        parts.append(box(f'cap{lx}{ly}', (sx, sy, 0.08), (lx, ly, TOP + 0.01), m['paint'], bev=0.02, seg=1))
    for (sx, sy, lx, ly) in ((2 * rx, 0.05, 0, -rz), (2 * rx, 0.05, 0, rz), (0.05, 2 * rz, -rx, 0), (0.05, 2 * rz, rx, 0)):
        parts.append(box(f'lining{lx}{ly}', (sx, sy, 0.3), (lx, ly, 0.15), m['lining'], bev=0))
    parts.append(box('pool-floor', (2 * rx, 2 * rz, 0.02), (0, 0, 0.03), m['floor'], bev=0))
    # A few sand patches and pebbles on the floor give the clear water something to show.
    for i, (x, y, r) in enumerate(((-2.4, 1.2, 0.5), (-1.7, 1.5, 0.3), (2.3, -1.0, 0.55), (0.6, 1.6, 0.28), (2.9, -1.5, 0.3))):
        parts.append(cyl(f'sand{i}', r, 0.02, (x, y, 0.05), m['sand'], verts=9, bev=0, seg=1, rot=(0, 0, i)))
        parts.append(sphere(f'pebble{i}', 0.09, (x + r * 0.6, y - r * 0.4, 0.07), m['plank_dark'] if i % 2 else m['paint'], segs=6, rings=4, scale=(1.3, 1, 0.6)))
    # Corner bollards (navy, brass cap) and a brass ladder on the near side.
    for sx in (-1, 1):
        for sy in (-1, 1):
            x, y = sx * (rx + KERB / 2), sy * (rz + KERB / 2)
            parts.append(cyl(f'bollard{sx}{sy}', 0.16, 0.34, (x, y, TOP + 0.17), m['navy'], verts=10, bev=0.03, seg=1))
            parts.append(lathe(f'bollard-cap{sx}{sy}', [(0.2, TOP + 0.33), (0.2, TOP + 0.39), (0.1, TOP + 0.44), (0, TOP + 0.45)], loc=(x, y, 0), material=m['brass'], segments=10, cap_bottom=True))
    for x in (1.3, 1.75):
        parts.append(tube(f'ladder-rail{x}', [(x, -rz - 0.05, TOP + 0.3), (x, -rz + 0.02, TOP + 0.25), (x, -rz + 0.06, 0.05)], 0.03, m['brass'], sides=5))
    for z in (0.12, 0.24):
        parts.append(box(f'ladder-rung{z}', (0.45, 0.04, 0.04), (1.525, -rz + 0.06, z), m['brass'], bev=0))
    parts += ring_buoy(m, 'pond-ring', (-rx + 0.5, rz + KERB / 2, TOP + 0.1), (0, 0, 0), major=0.24, minor=0.07)
    return join(parts, 'pond_frame')


def build_harpoon(m):
    # Blender -Y is the glTF front (+Z): the tip points to -Y.
    rot = (math.radians(90), 0, 0)
    parts = [
        cyl('hp-shaft', 0.035, 0.9, (0, 0.2, 0), m['plank_b'], verts=6, bev=0, seg=1, rot=rot),
        cyl('hp-grip', 0.045, 0.22, (0, 0.38, 0), m['red'], verts=6, bev=0, seg=1, rot=rot),
        cyl('hp-collar', 0.06, 0.08, (0, -0.24, 0), m['brass'], verts=8, bev=0, seg=1, rot=rot),
        box('hp-bar', (0.46, 0.06, 0.06), (0, -0.28, 0), m['brass'], bev=0.015, seg=1),
        cyl('hp-butt', 0.05, 0.06, (0, 0.63, 0), m['brass'], verts=6, bev=0, seg=1, rot=rot),
    ]
    for x in (-0.2, 0, 0.2):
        parts.append(cyl(f'hp-prong{x}', 0.025, 0.26, (x, -0.42, 0), m['paint'], verts=5, bev=0, seg=1, rot=rot))
        parts.append(lathe(f'hp-tip{x}', [(0.06, 0), (0, 0.17)], loc=(x, -0.54, 0), material=m['teal'], segments=4, rot=(math.radians(90), 0, 0)))
    return join(parts, 'harpoon')


# ------------------------------------------------------------------ hatch
def build_hatch(m):
    H = 0.3       # coaming height
    S = 0.82      # coaming half size
    body = [
        box('coaming', (2 * S, 2 * S, H), (0, 0, H / 2), m['teal'], bev=0.07, seg=2),
        box('coaming-stripe', (2 * S + 0.02, 2 * S + 0.02, 0.06), (0, 0, 0.1), m['paint'], bev=0.02, seg=1),
        box('coaming-cap', (2 * S + 0.08, 2 * S + 0.08, 0.07), (0, 0, H + 0.01), m['plank_a'], bev=0.03, seg=1),
        box('hold', (2 * S - 0.3, 2 * S - 0.3, 0.02), (0, 0, H + 0.05), m['hole'], bev=0),
        box('ladder-top', (0.6, 0.06, 0.05), (0, -S + 0.24, H + 0.04), m['brass'], bev=0),
    ]
    for sx in (-1, 1):
        for sy in (-1, 1):
            body.append(box(f'corner{sx}{sy}', (0.2, 0.2, H + 0.04), (sx * (S - 0.02), sy * (S - 0.02), (H + 0.04) / 2), m['brass'], bev=0.04, seg=1))
    # Lantern on a short post to the left, life ring leaning on the right. Both are walk-through dressing.
    lantern = post(m, -1.12, 0.3, h=1.0, r=0.06, name='hl-post')
    lantern += [
        cyl('hl-glass', 0.1, 0.2, (-1.12, 0.3, 1.25), m['glow'], verts=6, bev=0, seg=1),
        cyl('hl-base', 0.12, 0.04, (-1.12, 0.3, 1.14), m['iron'], verts=6, bev=0, seg=1),
        lathe('hl-roof', [(0.15, 1.35), (0.04, 1.5)], material=m['red'], segments=6, cap_bottom=True),
        torus('hl-hook', 0.04, 0.012, (-1.12, 0.3, 1.53), m['iron'], major_segs=8, minor_segs=4, rot=(math.radians(90), 0, 0)),
    ]
    lantern[-2].location = (-1.12, 0.3, 0)
    ring = ring_buoy(m, 'hatch-ring', (S + 0.2, -S + 0.05, 0.34), (math.radians(68), 0, math.radians(-20)), major=0.28, minor=0.08)
    hatch_body = join(body + lantern + ring, 'hatch_body')
    # The lid: five planks of three tones front to back, a brass frame, hinges, a porthole and a ring handle. Built in
    # place (closed) and then parented to the hinge empty.
    hinge = Vector((0, S + 0.04, H + 0.04))
    lid = []
    L = 2 * S - 0.12
    w = L / 5
    tones = (m['plank_a'], m['plank_c'], m['plank_b'], m['plank_c'], m['plank_a'])
    for i, tone in enumerate(tones):
        lid.append(box(f'lid-plank{i}', (w - 0.03, L, 0.1), (-L / 2 + w * (i + 0.5), 0, H + 0.1), tone, bev=0.025, seg=1))
    for (sx, sy, lx, ly) in ((L + 0.06, 0.08, 0, -L / 2), (L + 0.06, 0.08, 0, L / 2), (0.08, L, -L / 2, 0), (0.08, L, L / 2, 0)):
        lid.append(box(f'lid-band{lx}{ly}', (sx, sy, 0.12), (lx, ly, H + 0.11), m['brass'], bev=0.02, seg=1))
    lid += [
        cyl('porthole-rim', 0.27, 0.06, (0, 0.05, H + 0.17), m['brass'], verts=16, bev=0.02, seg=1),
        cyl('porthole-glass', 0.2, 0.06, (0, 0.05, H + 0.18), m['glass'], verts=16, bev=0, seg=1),
        sphere('porthole-shine', 0.05, (-0.07, 0.12, H + 0.21), m['paint'], segs=6, rings=4, scale=(1, 1, 0.3)),
        torus('handle', 0.1, 0.025, (0, -L / 2 + 0.16, H + 0.19), m['brass'], major_segs=10, minor_segs=4),
        box('handle-plate', (0.16, 0.1, 0.03), (0, -L / 2 + 0.06, H + 0.17), m['brass'], bev=0.01, seg=1),
    ]
    for x in (-0.45, 0.45):
        lid.append(box(f'hinge{x}', (0.16, 0.42, 0.04), (x, L / 2 - 0.16, H + 0.17), m['iron'], bev=0.01, seg=1))
        lid.append(cyl(f'hinge-pin{x}', 0.045, 0.2, (x, hinge.y - 0.02, hinge.z + 0.06), m['iron'], verts=8, bev=0, seg=1, rot=(0, math.radians(90), 0)))
    lid_mesh = join(lid, 'hatch_door')
    root = bpy.data.objects.new('hatch', None)
    bpy.context.scene.collection.objects.link(root)
    door = bpy.data.objects.new('door', None)
    bpy.context.scene.collection.objects.link(door)
    door.location = hinge
    door.parent = root
    hatch_body.parent = root
    lid_mesh.parent = door
    lid_mesh.matrix_parent_inverse = door.matrix_world.inverted()
    lid_mesh.location = -hinge
    lid_mesh.matrix_parent_inverse.identity()
    return root, door, hatch_body, lid_mesh


def export(objects, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_yup=True, export_apply=True,
                              export_materials='EXPORT', export_extras=False, export_cameras=False, export_lights=False,
                              export_animations=False, export_texcoords=False, export_normals=True)
    return os.path.getsize(path)


def preview_camera(target, scale, size):
    cam_data = bpy.data.cameras.new('Preview camera')
    cam_data.type = 'ORTHO'
    cam_data.ortho_scale = scale
    cam = bpy.data.objects.new('Preview camera', cam_data)
    bpy.context.scene.collection.objects.link(cam)
    t = Vector(target)
    cam.location = t + Vector((0, -25.4, 23.0)).normalized() * 30
    cam.rotation_euler = (t - cam.location).to_track_quat('-Z', 'Y').to_euler()
    bpy.context.scene.camera = cam
    bpy.context.scene.render.resolution_x, bpy.context.scene.render.resolution_y = size
    return cam


def main():
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    reset_scene()
    m = materials()
    kit = [build_rail(m), build_rail_post(m), build_gate(m), build_cargo(m), build_lantern(m), build_pond_frame(m), build_harpoon(m)]
    root, door, hatch_body, lid = build_hatch(m)
    tris = {o.name: triangles(o) for o in kit}
    tris['hatch'] = triangles(hatch_body) + triangles(lid)
    # Kit models stand side by side at the origin in the file; the runtime reads them by name, at their own origin.
    kit_size = export(kit, OUT_KIT)
    hatch_size = export([root, door, hatch_body, lid], OUT_HATCH)
    with open(MANIFEST, 'w') as f:
        json.dump(dict(triangles=tris, bytes={'boat-deck.glb': kit_size, 'boat-hatch.glb': hatch_size}, budget=BUDGET), f, indent=2)
    print('boat kit', kit_size, 'bytes; hatch', hatch_size, 'bytes;', json.dumps(tris))
    if '--render' in argv:
        studio(ground_color='#E3A05A', size=(1200, 800))
        # Line-up: rails, a gate, cargo, lantern; the hatch in its own shot (lid half open) and the pond frame.
        layout = {'rail': (-5.0, 1.5), 'rail_post': (-3.4, 1.5), 'boat_gate': (0.0, 2.0), 'deck_cargo': (4.6, 1.2), 'deck_lantern': (6.6, 1.5)}
        for o in kit:
            o.hide_render = o.name not in layout
            if o.name in layout:
                o.location = (layout[o.name][0], layout[o.name][1], 0)
        # Two more rail segments so the rope run reads.
        extra = []
        for i, x in enumerate((-7.0, -3.0)):
            c = kit[0].copy(); c.data = kit[0].data; c.location = (x, 1.5, 0); bpy.context.scene.collection.objects.link(c); extra.append(c)
        root.hide_render = True
        hatch_body.hide_render = lid.hide_render = True
        preview_camera((0, 1.5, 1.2), 15, (1400, 700))
        render(os.path.join(PREVIEWS, 'boat-deck.webp'))
        for o in kit + extra:
            o.hide_render = True
        hatch_body.hide_render = lid.hide_render = False
        door.rotation_euler = (math.radians(-28), 0, 0)
        preview_camera((0, 0, 0.5), 4.2, (900, 800))
        render(os.path.join(PREVIEWS, 'boat-hatch.webp'))
        door.rotation_euler = (0, 0, 0)
        hatch_body.hide_render = lid.hide_render = True
        pond = kit[5]
        pond.hide_render = False
        pond.location = (0, 0, 0)
        preview_camera((0, 0, 0.2), 11.5, (1100, 800))
        render(os.path.join(PREVIEWS, 'boat-pond.webp'))
    if '--install' in argv:
        shutil.copyfile(OUT_KIT, os.path.join(PUBLIC, 'boat-deck.glb'))
        shutil.copyfile(OUT_HATCH, os.path.join(PUBLIC, 'boat-hatch.glb'))
    over = [f'{k} {v} > {BUDGET[k]}' for k, v in tris.items() if v > BUDGET[k]]
    if over:
        print('FAILED: over budget:', ', '.join(over))
        sys.exit(1)


main()
