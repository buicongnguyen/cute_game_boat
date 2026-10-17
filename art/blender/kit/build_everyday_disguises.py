"""Cute Game Boat: the four everyday disguises (swimmer, K-pop singer, yoga teacher, nurse) and the bear and fox ears.

These replace the recoloured-hoodie versions the JS generator art/build-boat-appearance.mjs first appended (commit
3a17c62). They are built here, in the kit, with build_hero.py's own helpers, so they follow the disguise contract
(CONTRACT.md "Explorer and gear"): pieces named `<id>_<piece>@<part>`, modelled around the resting default hero in
explorer space, every object origin at 0, no textures, no emission (the game bakes avatar materials to vertex colours
and drops emission), at most 2,500 triangles each. The ears follow build_hero_styles.py's cat and bunny ears: one
`ears-<id>` and one `tail-<id>` mesh in explorer space; the game merges them into the head and body at load.

Owner direction (2026-10-17): each costume must read as its job at a glance on a phone, in saturated, high-contrast
colours (no pastel): swimmer aqua / coral / sunny yellow; K-pop the fanciest of the four (violet and hot-pink idol
jacket, gold epaulettes, sequins, a layered skirt, glossy boots, headset, crown clip, a heart light stick); yoga lime /
tangerine / magenta; nurse crisp white, strong red and candy pink. Bear ears warm chocolate with cream, fox ears bright
orange with white and dark tips.

Run from the repository root:

    blender -b --factory-startup --python art/blender/kit/build_everyday_disguises.py -- [--install] [--render] [--before]

Outputs:
    art/generated/kit/models/boat-disguises.glb   the four costume roots (plain glTF)
    art/generated/kit/models/boat-ears.glb        ears-bear_ears, tail-bear_ears, ears-fox_ears, tail-fox_ears
    art/generated/kit/icons/items/dz_*.webp, icons/looks/{bear,fox}_ears.webp
    art/previews/kit/everyday-disguises.webp      (--render) the line-up: 3/4 front, back, the game camera, the ears
    art/previews/kit/everyday-disguises-before.webp  (--before) the same line-up of the models now installed
--install runs `node art/build-boat-appearance.mjs`, which compresses the two GLBs and puts them into
public/assets/models/disguises.glb and hero-parts.glb in place of the earlier versions (every other model's bytes kept
as they are), and copies the icons into public/assets/icons/.
"""
import bpy
import math
import os
import shutil
import subprocess
import sys
from mathutils import Matrix, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)
import build_hero as BH  # noqa: E402
import build_hero_styles as BS  # noqa: E402
import hero_spec as HS  # noqa: E402
from build_hero import (C, TAU, Costume, Geo, Vector as V, back_point, band_on_hood, boot, ellipsoid, env_r,  # noqa: E402,F401
                        facing, frame_m, glove, join, lathe, leaf_solid, pack_cover, rbox, shell_arm, shell_leg,
                        shell_torso, smoothstep, star_solid, torus, tube, xf)
from style import export_glb, reset_scene  # noqa: E402

IDS = [('dz_swimmer', 'Sporty swimmer'), ('dz_kpop', 'K-pop singer'), ('dz_yoga', 'Yoga teacher'), ('dz_nurse', 'Kindhearted nurse')]
EARS = ('bear_ears', 'fox_ears')
OUT_DZ = os.path.join(BH.MODELS, 'boat-disguises.glb')
OUT_EARS = os.path.join(BH.MODELS, 'boat-ears.glb')
LOOK_ICONS = os.path.join(BH.GEN, 'icons', 'looks')
SKIN = '#FFD3AE'   # the hero's skin, for bare arms, a midriff and bare feet


def cap_shell(r, front, back, mat, segs=16, rows=4, thick=0.03):
    """A cap from the crown to an edge `front` degrees from the crown over the brow and `back` at the nape."""
    edge = lambda phi: front + (back - front) * ((1 - math.cos(math.radians(phi))) / 2) ** 0.8
    phis = [360 * i / segs for i in range(segs)]
    verts, faces = [BS.on_hood(0, 0, r)], []
    for j in range(1, rows + 1):
        for phi in phis:
            verts.append(BS.on_hood(edge(phi) * j / rows, phi, r))
    ring = lambda j, i: 1 + (j - 1) * segs + i % segs
    for i in range(segs):
        faces.append((0, ring(1, i), ring(1, i + 1)))
        for j in range(1, rows):
            faces.append((ring(j, i), ring(j + 1, i), ring(j + 1, i + 1), ring(j, i + 1)))
    return Geo(verts, faces, [mat] * len(faces)).orient(lambda p: p - C).solidify(thick)


def on_cap(theta, phi, r):
    return BS.on_hood(theta, phi, r)


def prism(outline, thick, m, mat=None):
    """A flat badge: a convex-or-star polygon (local XY, fanned from its centre) extruded along local +Z."""
    n = len(outline)
    verts = [(x, y, thick / 2) for x, y in outline] + [(x, y, -thick / 2) for x, y in outline] + [(0, 0, thick / 2), (0, 0, -thick / 2)]
    top, bot = 2 * n, 2 * n + 1
    faces = [(top, i, (i + 1) % n) for i in range(n)] + [(bot, n + (i + 1) % n, n + i) for i in range(n)]
    faces += [(i, n + i, n + (i + 1) % n, (i + 1) % n) for i in range(n)]
    return Geo(verts, faces, [mat] * len(faces)).closed().transformed(m)


def slab(w, h, thick, m, mat=None):
    """A thin box (12 triangles): straps, bands, plates."""
    return prism([(-w / 2, -h / 2), (w / 2, -h / 2), (w / 2, h / 2), (-w / 2, h / 2)], thick, m, mat)


def cross(m, mat, size=0.14, bar=0.05, thick=0.025):
    """A chunky red cross standing on a surface frame m (local +Z out): one 12-sided badge."""
    a, b = size / 2, bar / 2
    return prism([(b, b), (b, a), (-b, a), (-b, b), (-a, b), (-a, -b), (-b, -b), (-b, -a), (b, -a), (b, -b), (a, -b), (a, b)], thick, m, mat)


def heart(m, mat, r=0.1, depth=0.07):
    """A puffy heart in local XY facing local +Z: two lobes and a point."""
    lobes = [ellipsoid(None, (r * 0.62, r * 0.62, depth / 2), segs=7, rings=3, m=m @ xf((s * r * 0.45, r * 0.25, 0))) for s in (-1, 1)]
    tip = lathe([(0.0, 0.0), (r * 0.78, r * 0.55), (r * 0.5, r * 0.85), (0.0, r * 0.9)], 6)
    tip = tip.transformed(m @ xf((0, -r * 0.72, 0)) @ Matrix.Diagonal((1, 1, depth / (r * 1.2), 1)) @ xf(rot=(-math.pi / 2, 0, 0)))
    return join(*lobes, tip.closed()).retag(mat)


def chest(z, out=0.04):
    return Vector((0, -(env_r(z) + out), z))


def bare_arm(k, side, part, skin, sleeve, sleeve_to=0.98, cuff=None):
    """A short sleeve (above sleeve_to) over a skin cover down to the wrist, so the player's shirt colour never shows."""
    k.add('sleeve', part, shell_arm(side, 0.024, rows=4, tag=lambda z: sleeve if z > sleeve_to else (cuff if cuff and z > sleeve_to - 0.04 else None),
                                    lip_tag='keep'), skin)


# ------------------------------------------------------------------ swimmer
def dz_swimmer():
    k = Costume('dz_swimmer', 'swimmer')
    aqua = k.m('aqua', '#00CFE0', 0.32)
    aqua_dark = k.m('aqua dark', '#0096B8', 0.35)
    coral = k.m('coral', '#FF4F45', 0.32)
    sun = k.m('sun', '#FFD21A', 0.3)
    navy = k.m('navy', '#16245E', 0.3)
    lens = k.m('lens', '#7DF2FF', 0.12)
    beak = k.m('beak', '#FF8A12', 0.3)
    white = k.m('white', '#FFFFFF', 0.4)
    # Swim cap in coral with a sunny stripe over the crown; goggles pushed up on the forehead.
    k.add('cap', 'head', cap_shell(0.672, 74, 112, coral, segs=16, rows=3), None)
    k.add('cap', 'head', tube([on_cap(t, 0, 0.69) for t in range(-100, 61, 20)], 0.04, sides=5, flatten=0.45, up=(1, 0, 0),
                              cap_start=True, cap_end=True), sun)
    k.add('cap', 'head', band_on_hood(0.675, 1.865, 1.905, segs=12), navy)   # the goggle strap round the cap
    for s in (-1, 1):
        n = BS.hood_dir(58, 21 * s)
        p = C + n * 0.7
        k.add('cap', 'head', torus(p, n, 0.088, 0.03, 8, 3), navy)
        k.add('cap', 'head', ellipsoid(None, (0.082, 0.072, 0.03), segs=8, rings=2, m=facing(p + n * 0.012, n)), lens)
        k.add('cap', 'head', ellipsoid(None, (0.025, 0.02, 0.012), segs=5, rings=2, m=facing(p + n * 0.04 + Vector((-0.03 * s, 0, 0.03)), n)), white)
    # Rash guard: aqua with bold coral bands and a navy collar; short swim legs.
    k.add('suit', 'body', shell_torso(0.034, bottom=0.46, rows=8, segs=20, lip_tag=navy,
                                      tag=lambda phi, z: coral if (0.8 <= z < 0.88 or 0.98 <= z < 1.05) else None), aqua)
    k.add('suit', 'body', star_solid(5, 0.075, 0.034, 0.022, 0.008).retag(sun).transformed(facing(chest(1.1, 0.01), (0, -1, 0.35))))
    # The rubber duck ring round the waist: a fat yellow torus, the duck's head and beak in front and a tail behind.
    k.add('ring', 'body', torus((0, 0, 0.56), (0, 0, 1), 0.5, 0.125, 18, 6), sun)
    for s in (-1, 1):   # coral dashes on the ring
        a = math.radians(90 + 50 * s)
        k.add('ring', 'body', torus((0.5 * math.cos(a), -0.5 * math.sin(a) * -1, 0.56), (math.sin(a), math.cos(a), 0), 0.128, 0.014, 8, 3), coral)
    hd = Vector((0, -0.6, 0.79))
    k.add('ring', 'body', ellipsoid(hd, (0.15, 0.14, 0.15), segs=8, rings=5), sun)
    k.add('ring', 'body', ellipsoid(hd + Vector((0, -0.15, -0.03)), (0.085, 0.06, 0.035), segs=8, rings=3), beak)
    for s in (-1, 1):
        k.add('ring', 'body', ellipsoid(hd + Vector((0.07 * s, -0.115, 0.05)), (0.024, 0.016, 0.03), segs=5, rings=3), navy)
    k.add('ring', 'body', lathe([(0.0, 0.0), (0.07, 0.0), (0.0, 0.16)], 5).transformed(frame_m((0, 0.6, 0.62), (0, 0.5, 1), (0, -1, 0.3))).closed(), sun)
    # A swim bag over the backpack with a towel rolled on top.
    k.add('pack', 'body', pack_cover(radius=0.09), aqua_dark)
    bp = back_point(0.9)
    k.add('pack', 'body', tube([bp + Vector((-0.24, -0.06, 0.25)), bp + Vector((0.24, -0.06, 0.25))], 0.075, sides=8,
                               cap_start=True, cap_end=True), white)
    for x in (-0.12, 0.12):
        k.add('pack', 'body', torus(bp + Vector((x, -0.06, 0.25)), (1, 0, 0), 0.077, 0.012, 8, 3), coral)
    for side, part in ((-1, 'arm-left'), (1, 'arm-right')):
        k.add('sleeve', part, shell_arm(side, 0.026, rows=4, tag=lambda z: coral if 0.88 <= z < 0.95 else None, lip_tag=navy), aqua)
    # Swim legs and big coral flippers.
    for side, part in ((-1, 'leg-left'), (1, 'leg-right')):
        k.add('leg', part, shell_leg(side, 0.026, bottom=0.42, rows=2), aqua)
        k.add('fin', part, boot(side, 0.03, shaft=0.27, segs=7, tag=lambda z0, z1: navy if z0 >= 0.24 else None), coral)
        m = frame_m((0.18 * side, -0.2, 0.025), (0, -1, 0), (0, 0, 1))
        k.add('fin', part, leaf_solid(0.46, 0.4, 0.05, rows=3, cup=-0.05, bend=0.02, shape=0.45, taper=-0.35).transformed(m), coral)
        for x in (-0.07, 0.07):
            k.add('fin', part, slab(0.03, 0.26, 0.02, xf((0.18 * side + x, -0.42, 0.06))), navy)
    return k


# ------------------------------------------------------------------ K-pop idol
def dz_kpop():
    k = Costume('dz_kpop', 'kpop')
    violet = k.m('violet', '#7A22FF', 0.28)
    pink = k.m('pink', '#FF2E9A', 0.28)
    gold = k.m('gold', '#FFC82E', 0.22, 0.35)
    white = k.m('white', '#FFFFFF', 0.25)
    ink = k.m('ink', '#1A1430', 0.25)
    cyan = k.m('cyan', '#2FF0FF', 0.2)
    hair = k.m('hair', '#FF4FB6', 0.3)
    # Hot-pink idol hair: a dyed cap over the hero's hair, a big swoop over the brow and a gold star clip.
    k.add('hair', 'head', BH.hair_geo(rows=3).transformed(Matrix.Translation(C) @ Matrix.Scale(1.085, 4) @ Matrix.Translation(-C)), hair)  # the hero's own hair shape, dyed
    sw = [on_cap(62, -40, 0.64), on_cap(42, -20, 0.71), on_cap(25, 10, 0.75), on_cap(30, 45, 0.73), on_cap(55, 62, 0.66)]
    k.add('hair', 'head', tube(sw, [0.05, 0.13, 0.15, 0.11, 0.0], sides=6, cap_start=True), hair)
    n = BS.hood_dir(52, 58)
    k.add('crown', 'head', star_solid(5, 0.13, 0.058, 0.04, 0.014).retag(gold).transformed(facing(C + n * 0.69, n)))
    k.add('crown', 'head', ellipsoid(None, (0.035, 0.035, 0.02), segs=5, rings=2, m=facing(C + n * 0.72, n)), cyan)
    # Headset: a band over the crown, an ear cup and a boom mic curving to the mouth.
    band = [on_cap(t, 90, 0.705) for t in (-80, -40, 0, 40, 80)]
    k.add('headset', 'head', tube(band, 0.026, sides=5, cap_start=True, cap_end=True), ink)
    for s in (-1, 1):
        k.add('headset', 'head', ellipsoid(C + Vector((0.655 * s, 0.0, -0.02)), (0.05, 0.11, 0.11), segs=7, rings=3), ink)
        k.add('headset', 'head', ellipsoid(C + Vector((0.705 * s, 0.0, -0.02)), (0.02, 0.06, 0.06), segs=6, rings=2), pink)
    boom = [C + Vector((-0.66, -0.08, -0.06)), C + Vector((-0.6, -0.36, -0.15)), C + Vector((-0.38, -0.58, -0.18)), C + Vector((-0.17, -0.62, -0.17))]
    k.add('headset', 'head', tube(boom, 0.016, sides=4, cap_start=True, cap_end=True), ink)
    k.add('headset', 'head', ellipsoid(boom[-1], (0.045, 0.04, 0.04), segs=6, rings=4), gold)
    # Cropped stage jacket: electric violet with hot-pink piping, gold trim, a gold chain and sequins; a white crop top under it.
    k.add('jacket', 'body', shell_torso(0.05, bottom=0.6, rows=6, segs=18, lip_tag=gold,
                                        tag=lambda phi, z: white if z < 0.76 else (gold if z < 0.8 else (pink if abs(math.remainder(phi, TAU)) < 0.3 else None))), violet)
    k.add('jacket', 'body', tube([chest(1.02, 0.06) + Vector((-0.24, 0.07, 0)), chest(0.9, 0.065), chest(1.02, 0.06) + Vector((0.24, 0.07, 0))],
                                 0.018, sides=4, cap_start=True, cap_end=True), gold)
    for i, (x, z) in enumerate(((-0.2, 0.86), (0.2, 0.86), (-0.27, 0.98), (0.27, 0.98), (-0.13, 1.08), (0.13, 1.08), (0.0, 0.81))):
        y = -math.sqrt(max(0.0, (env_r(z) + 0.06) ** 2 - x * x))
        n = Vector((x, y, 0.1)).normalized()
        g = star_solid(4, 0.04, 0.015, 0.014, 0.006) if i % 2 else ellipsoid((0, 0, 0), (0.026, 0.026, 0.013), segs=6, rings=2)
        k.add('jacket', 'body', g.transformed(facing(Vector((x, y, z)) + n * 0.004, n)).retag(cyan if i % 3 == 0 else gold))
    # A bold belt with a heart buckle and a two-layer skirt (hot pink over gold) with a violet frill.
    k.add('belt', 'body', lathe([(env_r(0.6) + 0.04, 0.585), (env_r(0.6) + 0.065, 0.6), (env_r(0.66) + 0.065, 0.66), (env_r(0.66) + 0.04, 0.675)], 12), ink)
    k.add('belt', 'body', heart(facing(chest(0.63, 0.07), (0, -1, 0)), gold, 0.06, 0.035))
    segs = 12
    phis = [TAU * i / segs for i in range(segs)]
    for layer, (z0, z1, flare, mat, inner) in enumerate(((0.62, 0.4, 0.17, gold, violet), (0.64, 0.47, 0.13, pink, violet))):
        zs = [z1, z1 + 0.04, z0]

        def skirt_r(phi, z, i, j, z0=z0, z1=z1, flare=flare):
            t = (z0 - z) / (z0 - z1)
            return env_r(0.6) + 0.06 + flare * t ** 0.8 + (0.025 if i % 2 else -0.01) * t
        sk = BH.axis_grid(phis, zs, skirt_r, tag=lambda i, j, mat=mat, layer=layer: (violet if layer == 1 and j == 0 else None))
        k.add('skirt', 'body', sk.solidify(0.018, inner_tag=inner), mat)
    k.add('pack', 'body', pack_cover(radius=0.1), violet)
    k.add('pack', 'body', star_solid(5, 0.17, 0.075, 0.04, 0.015).retag(pink).transformed(facing(back_point(0.92) + Vector((0, 0.01, 0)), (0, 1, 0.1))))
    # Sleeves with big gold epaulettes (a fringe of gold tassels) and white gloves.
    for side, part in ((-1, 'arm-left'), (1, 'arm-right')):
        k.add('sleeve', part, shell_arm(side, 0.032, rows=4, tag=lambda z: pink if z < 0.86 else None, lip_tag=gold), violet)
        top = Vector((0.37 * side, 0.02, 1.17))
        k.add('sleeve', part, ellipsoid(top, (0.17, 0.17, 0.075), segs=8, rings=3), gold)
        for a in (-45, 0, 45):   # the tassels hang from the outer rim
            q = Vector((0.525 * side, 0.02 + 0.15 * math.sin(math.radians(a)), 1.14))
            k.add('sleeve', part, tube([q, q + Vector((0.02 * side, 0, -0.1))], [0.022, 0.0], sides=4, cap_start=True), gold)
        k.add('sleeve', part, glove(side, 0.02, segs=6, rings=4), white)
    # Glossy black tights and white stage boots with hot-pink heels and gold cuffs.
    for side, part in ((-1, 'leg-left'), (1, 'leg-right')):
        k.add('leg', part, shell_leg(side, 0.02, bottom=0.38, rows=2), ink)
        k.add('leg', part, boot(side, 0.03, shaft=0.4, segs=7, cuff=0.02, tag=lambda z0, z1: pink if z1 <= 0.03 else (gold if z0 >= 0.39 else None)), white)
    # The light stick: a white handle with a big hot-pink heart in a cyan halo.
    H = Vector(HS.HANDS['hand-right'])
    a = Vector((0.18, -0.45, 0.88)).normalized()
    k.add('stick', 'hand-right', tube([H - a * 0.14, H + a * 0.36], 0.034, sides=6, cap_start=True, cap_end=True), white)
    k.add('stick', 'hand-right', ellipsoid(H + a * 0.36, (0.05, 0.05, 0.04), segs=6, rings=3), gold)
    sm = frame_m(H + a * 0.56, a, Vector((0, -1, 0.15)))   # a big puffy star, crossed so it reads from every side
    g = star_solid(5, 0.21, 0.095, 0.07, 0.03)
    k.add('stick', 'hand-right', join(g, Geo(g.verts, g.faces).transformed(Matrix.Rotation(math.pi / 2, 4, 'Y'))).transformed(sm), pink)
    k.add('stick', 'hand-right', ellipsoid(None, (0.075, 0.075, 0.075), segs=6, rings=4, m=sm), cyan)
    return k


# ------------------------------------------------------------------ yoga teacher
def dz_yoga():
    k = Costume('dz_yoga', 'yoga')
    lime = k.m('lime', '#8EE01E', 0.35)
    tang = k.m('tangerine', '#FF7A12', 0.35)
    magenta = k.m('magenta', '#EE1E8A', 0.33)
    skin = k.m('skin', SKIN, 0.5)
    hair = k.m('hair', '#7C4527', 0.36)
    white = k.m('white', '#FFFFFF', 0.4)
    # A tangerine headband and a top bun with a magenta scrunchie.
    edge = lambda phi: 60 + 45 * ((1 - math.cos(math.radians(phi))) / 2)   # over the brow, down at the nape: it hugs the hair
    ring = [on_cap(edge(phi), phi, 0.655) for phi in range(0, 360, 24)]
    k.add('band', 'head', tube(ring + ring[:1], 0.05, sides=5, flatten=0.4, up=(0, 0, 1)), tang)
    k.add('band', 'head', ellipsoid(on_cap(70, 60, 0.68), (0.07, 0.05, 0.06), segs=6, rings=3), magenta)
    bun = Vector((0, 0.08, 2.27))
    k.add('bun', 'head', ellipsoid(bun, (0.19, 0.18, 0.15), segs=10, rings=6), hair)
    k.add('bun', 'head', torus(bun + Vector((0, 0, -0.1)), (0, 0.15, 1), 0.13, 0.04, 12, 5), magenta)
    # Sports top in lime with a magenta trim over a bare midriff; magenta leggings with a tangerine waistband.
    k.add('top', 'body', shell_torso(0.032, bottom=0.8, rows=5, segs=20, lip_tag=magenta,
                                     tag=lambda phi, z: magenta if z < 0.85 else None), lime)
    k.add('waist', 'body', shell_torso(0.022, bottom=0.46, top=0.82, rows=4, segs=18, neck=env_r(0.82) + 0.022,
                                       tag=lambda phi, z: tang if 0.62 <= z < 0.68 else (magenta if z < 0.62 else None)), skin)
    # The calm lotus charm on a cord.
    lc = chest(0.95, 0.06)
    for i in range(6):
        ang = TAU * i / 6
        m = frame_m(lc, (math.cos(ang), 0, math.sin(ang)), (0, -1, 0))
        k.add('lotus', 'body', leaf_solid(0.1, 0.07, 0.025, rows=3, cup=0.3, bend=-0.3, shape=0.6, taper=0.0).transformed(m), magenta if i % 2 else white)
    k.add('lotus', 'body', ellipsoid(lc + Vector((0, -0.02, 0)), (0.035, 0.025, 0.035), segs=6, rings=3), tang)
    # The rolled yoga mat slung across the back, over a small lime bag (the backpack).
    k.add('pack', 'body', pack_cover(radius=0.09), lime)
    a0, a1 = Vector((-0.64, 0.52, 1.13)), Vector((0.64, 0.52, 1.13))   # across the shoulders: seen from the front too
    k.add('mat', 'body', tube([a0, a1], 0.135, sides=12, cap_start=True, cap_end=True), tang)
    ax = (a1 - a0).normalized()
    for t in (0.0, 1.0):
        p = a0.lerp(a1, t) + ax * (0.005 if t else -0.005)
        k.add('mat', 'body', torus(p, ax, 0.065, 0.02, 10, 3), white)
    for t in (0.25, 0.75):
        k.add('mat', 'body', torus(a0.lerp(a1, t), ax, 0.138, 0.02, 12, 3), magenta)
    k.add('mat', 'body', tube([a0.lerp(a1, 0.25) + Vector((0, -0.12, -0.05)), chest(1.0, 0.03) + Vector((-0.05, 0, 0)),
                               chest(0.82, 0.04) + Vector((0.22, 0, 0))], 0.022, sides=4, flatten=0.4, cap_start=True, cap_end=True, up=(0, -1, 0)), magenta)
    # Sleeveless: a skin cover on the arms with a lime cap at the shoulder.
    for side, part in ((-1, 'arm-left'), (1, 'arm-right')):
        bare_arm(k, side, part, skin, lime, sleeve_to=1.06)
        k.add('sleeve', part, torus(BH.hand_centre(side) + Vector((0, 0.0, 0.1)), (0, 0, 1), 0.105, 0.025, 10, 4), tang)  # wristband
    # Leggings to the ankle, and bare feet (soft skin cover with toes).
    for side, part in ((-1, 'leg-left'), (1, 'leg-right')):
        k.add('leg', part, shell_leg(side, 0.026, bottom=0.22, rows=3), magenta)
        k.add('foot', part, boot(side, 0.014, shaft=0.23, segs=10), skin)
        for i, x in enumerate((-0.07, -0.025, 0.02, 0.06)):
            k.add('foot', part, ellipsoid((0.18 * side + x * side, -0.27, 0.05), (0.03, 0.035, 0.03), segs=5, rings=3), skin)
    return k


# ------------------------------------------------------------------ nurse
def dz_nurse():
    k = Costume('dz_nurse', 'nurse')
    white = k.m('white', '#FFFFFF', 0.4)
    red = k.m('red', '#E8162A', 0.32)
    pink = k.m('pink', '#FF4FA0', 0.32)
    skin = k.m('skin', SKIN, 0.5)
    steel = k.m('steel', '#C8D6E8', 0.2, 0.4)
    ink = k.m('ink', '#2A2440', 0.3)
    # The white nurse cap with a red cross, perched on the front of the head.
    cm = facing(on_cap(28, 0, 0.66), BS.hood_dir(28, 0) + Vector((0, -0.6, 0)))
    k.add('cap', 'head', rbox((0.56, 0.24, 0.16), 0.05, 1, m=cm @ xf((0, 0.0, 0.03))), white)
    k.add('cap', 'head', slab(0.6, 0.05, 0.18, cm @ xf((0, -0.12, 0.04))), red)
    k.add('cap', 'head', cross(cm @ xf((0, 0.03, 0.12)), red, 0.15, 0.055, 0.03))
    # A white scrub dress with a red collar and hem, a red-cross badge, a pink pocket with a pen.
    k.add('dress', 'body', shell_torso(0.036, bottom=0.6, rows=5, segs=18, lip_tag=red), white)
    k.add('dress', 'body', cross(facing(chest(0.98, 0.045) + Vector((0.13, 0.0, 0.0)), (0.3, -1, 0.15)), red, 0.12, 0.045, 0.025))
    pk = facing(chest(0.82, 0.045) + Vector((-0.14, 0.0, 0)), (-0.33, -1, 0.1))
    k.add('dress', 'body', slab(0.12, 0.1, 0.02, pk), pink)
    k.add('dress', 'body', slab(0.02, 0.08, 0.02, pk @ xf((0.02, 0.06, 0.012))), ink)
    segs = 18
    phis = [TAU * i / segs for i in range(segs)]
    zs = [0.4, 0.44, 0.54, 0.66]

    def skirt_r(phi, z, i, j):
        t = (0.66 - z) / 0.26
        return env_r(0.66) + 0.045 + 0.13 * t ** 0.9
    k.add('skirt', 'body', BH.axis_grid(phis, zs, skirt_r, tag=lambda i, j: red if j == 0 else None).solidify(0.02, inner_tag=white), white)
    # Stethoscope: pink tubing round the neck, earpieces, and a steel chest piece.
    neck = [Vector((math.sin(a) * 0.33, -math.cos(a) * 0.33, 1.16 - 0.04 * math.cos(a))) for a in [math.radians(d) for d in range(-150, 151, 30)]]
    k.add('scope', 'body', tube(neck, 0.024, sides=5, cap_start=True, cap_end=True), pink)
    k.add('scope', 'body', tube([neck[3], chest(1.02, 0.07) + Vector((0.02, 0, 0)), chest(0.9, 0.07)], 0.022, sides=5, cap_end=True), pink)
    k.add('scope', 'body', lathe([(0.0, -0.02), (0.07, -0.015), (0.07, 0.015), (0.0, 0.025)], 10).transformed(facing(chest(0.86, 0.09), (0, -1, 0.1))), steel)
    for s in (-1, 1):
        k.add('scope', 'body', ellipsoid(neck[0 if s < 0 else -1], (0.035, 0.035, 0.035), segs=6, rings=3), steel)
    # A white medical bag with a red cross over the backpack.
    k.add('pack', 'body', pack_cover((0.04, 0.03, 0.02), radius=0.09), white)
    k.add('pack', 'body', cross(facing(back_point(0.9) + Vector((0, 0.02, 0)), (0, 1, 0)), red, 0.24, 0.085, 0.03))
    k.add('pack', 'body', slab(0.48, 0.05, 0.05, xf((0, 0.36, 1.14))), red)
    # Short white sleeves with a pink cuff over bare arms.
    for side, part in ((-1, 'arm-left'), (1, 'arm-right')):
        bare_arm(k, side, part, skin, white, sleeve_to=0.97, cuff=pink)
    # White tights and comfy white shoes with pink soles.
    for side, part in ((-1, 'leg-left'), (1, 'leg-right')):
        k.add('leg', part, shell_leg(side, 0.02, bottom=0.3, rows=3), white)
        k.add('leg', part, boot(side, 0.034, shaft=0.27, segs=10, tag=lambda z0, z1: pink if z1 <= 0.03 else None), white)
    # A big cute syringe in the right hand: a pink barrel with white bands, a plunger and a short blunt tip.
    H = Vector(HS.HANDS['hand-right'])
    a = Vector((0.35, -0.5, 0.8)).normalized()
    k.add('syringe', 'hand-right', tube([H - a * 0.2, H + a * 0.4], 0.075, sides=8, cap_start=True, cap_end=True), pink)
    for t in (-0.05, 0.12, 0.28):
        k.add('syringe', 'hand-right', torus(H + a * t, a, 0.078, 0.014, 8, 3), white)
    k.add('syringe', 'hand-right', tube([H - a * 0.2, H - a * 0.36], 0.025, sides=6, cap_start=True), white)
    k.add('syringe', 'hand-right', slab(0.17, 0.17, 0.04, frame_m(H - a * 0.37, a, Vector((0, 0, 1))) @ xf(rot=(math.pi / 2, 0, 0))), white)
    k.add('syringe', 'hand-right', lathe([(0.0, 0.0), (0.05, 0.0), (0.016, 0.07), (0.012, 0.16), (0.0, 0.17)], 6).transformed(facing(H + a * 0.4, a)).closed(), steel)
    return k


BUILDERS = {'dz_swimmer': dz_swimmer, 'dz_kpop': dz_kpop, 'dz_yoga': dz_yoga, 'dz_nurse': dz_nurse}


# ------------------------------------------------------------------ ears
def ear_mats():
    F = BS.FMx
    return dict(choc=F('Ears bear fur', '#8A4A22'), cream=F('Ears bear cream', '#FFDCA8'),
                orange=F('Ears fox fur', '#FF7A14'), white=F('Ears fox white', '#FFFFFF'), dark=F('Ears fox tip', '#3A2230'))


def bear_ears(M):
    g = []
    for s in (-1, 1):
        c = BS.on_head(44, s, 0.62)
        n = Vector((0.55 * s, -0.25, 0.8)).normalized()
        g.append(ellipsoid(None, (0.2, 0.2, 0.09), segs=12, rings=5, m=facing(c, Vector((0.4 * s, -1, 0.35)))).retag(M['choc']))
        g.append(ellipsoid(None, (0.125, 0.125, 0.03), segs=10, rings=3, m=facing(c + Vector((0, -0.075, 0)), Vector((0.4 * s, -1, 0.35)))).retag(M['cream']))
        g.append(ellipsoid(c - n * 0.06, (0.12, 0.09, 0.08), segs=8, rings=4).retag(M['choc']))  # the root, tucked into the hair
    return join(*g)


def bear_tail(M):
    return join(ellipsoid((0, 0.47, 0.6), (0.13, 0.12, 0.13), segs=10, rings=6).retag(M['choc']),
                ellipsoid((0, 0.57, 0.62), (0.06, 0.03, 0.06), segs=6, rings=3).retag(M['cream']))


def fox_ears(M):
    g = []
    for s in (-1, 1):
        base = BS.on_head(36, s, 0.54)
        out = Vector((0.5 * s, -0.04, 0.86)).normalized()
        path = [base + out * t for t in (0.0, 0.12, 0.24, 0.34, 0.44)]
        g.append(tube(path, [0.19, 0.18, 0.13, 0.065, 0.0], sides=8, flatten=0.4, up=(0, 1, 0), cap_start=True).retag(M['orange']))
        ip = [p + Vector((0, -0.05, 0)) for p in path[1:4]] + [path[4] + Vector((0, -0.04, -0.03))]
        g.append(tube(ip, [0.12, 0.09, 0.045, 0.0], sides=6, flatten=0.25, up=(0, 1, 0), cap_start=True).retag(M['white']))
        tip = [base + out * t for t in (0.33, 0.4, 0.47)]
        g.append(tube(tip, [0.085, 0.05, 0.0], sides=8, flatten=0.45, up=(0, 1, 0), cap_start=True).retag(M['dark']))
    return join(*g)


def fox_tail(M):
    pts = BH.bez([(0, 0.32, 0.6), (0, 0.72, 0.5), (0.16, 0.86, 0.8), (0.2, 0.7, 1.08)], 8)
    rad = [0.07, 0.13, 0.18, 0.2, 0.19, 0.16, 0.1, 0.0]
    return join(tube(pts[:6], rad[:6], sides=8, cap_start=True, cap_end=True).retag(M['orange']),
                tube(pts[5:], rad[5:], sides=8, cap_start=True).retag(M['white']))


EAR_BUILDERS = {'bear_ears': (bear_ears, bear_tail), 'fox_ears': (fox_ears, fox_tail)}


# ------------------------------------------------------------------ build, check, export
def register():
    """Let build_hero's spawn/dress put these costumes on (its BUILDERS table)."""
    BH.BUILDERS.update(BUILDERS)


def build_all():
    reset_scene()
    register()
    roots, report, fails = [], {}, []
    for did, _ in IDS:
        k, root, objs = BH.build_costume(did)
        roots.append(root)
        tris = sum(BH.mesh_tris(o) for o in objs)
        tags = sorted({o.name.rsplit('@', 1)[1] for o in objs})
        report[did] = dict(triangles=tris, pieces={o.name[len(did) + 1:]: BH.mesh_tris(o) for o in objs}, tags=tags)
        for o in objs:
            for p in BH.world_points(o):
                if abs(p.x) > 0.79 or p.z < -0.05 or p.z > 2.5:
                    fails.append(f'{o.name}: point {tuple(round(c, 3) for c in p)} outside the envelope box')
                    break
        if tris > BH.DZ_TRI_LIMIT:
            fails.append(f'{did}: {tris} triangles (> {BH.DZ_TRI_LIMIT})')
        if not set(BH.PARTS) <= set(tags):
            fails.append(f'{did}: pieces miss parts {set(BH.PARTS) - set(tags)}')
        print(f'  {did:11s} {tris:5d} tris  ' + ', '.join(f'{n}:{t}' for n, t in report[did]['pieces'].items()))
    size = export_glb([o for r in roots for o in BH.tree(r)], OUT_DZ)
    print(f'  boat-disguises.glb {size} bytes')
    for r in roots:
        BH.remove_tree(r)
    M = ear_mats()
    objs = []
    for eid, (ef, tf) in EAR_BUILDERS.items():
        for name, geo in (('ears-' + eid, ef(M)), ('tail-' + eid, tf(M))):
            o = BH.Piece(name).add(geo).build((0, 0, 0), name)
            o.data.name = name
            objs.append(o)
            report[name] = BH.mesh_tris(o)
            print(f'  {name:15s} {report[name]:4d} tris')
    size = export_glb(objs, OUT_EARS)
    print(f'  boat-ears.glb {size} bytes')
    for o in objs:
        bpy.data.objects.remove(o, do_unlink=True)
    return report, fails


def spawn_ears(tag, eid, loc=(0, 0, 0), yaw=0.0):
    hero, meshes = BH.spawn(tag, loc=loc, yaw=yaw)
    hero['head-leaf'].hide_render = True
    M = ear_mats()
    ef, tf = EAR_BUILDERS[eid]
    e = BH.Piece(tag + 'ears').add(ef(M)).build((0, 0, 0), tag + 'ears')
    t = BH.Piece(tag + 'tail').add(tf(M)).build((0, 0, 0), tag + 'tail')
    for o, part in ((e, 'head'), (t, 'body')):
        o.parent = hero[part]
        o.matrix_parent_inverse = hero[part].matrix_world.inverted() @ hero['hero'].matrix_world
    bpy.context.view_layer.update()
    return hero, meshes + [e, t]


def import_installed(tag):
    """--before: the installed (earlier) costumes and ears, imported from public/assets/models."""
    out = {}
    for f in ('disguises.glb', 'hero-parts.glb'):
        before = set(bpy.data.objects)
        import style
        style.import_glb(os.path.join(BH.PUBLIC_MODELS, f))
        for o in set(bpy.data.objects) - before:
            o.name = tag + o.name
            out[o.name[len(tag):]] = o
    return out


def wear_imported(hero, imported, did):
    objs = []
    for name, o in imported.items():
        if o.type != 'MESH':
            continue
        if did.startswith('dz_') and name.startswith(did + '_') and '@' in name:
            part = name.rsplit('@', 1)[1]
        elif name in ('ears-' + did, 'tail-' + did):
            part = 'head' if name.startswith('ears') else 'body'
        else:
            continue
        c = o.copy()
        c.data = o.data.copy()
        bpy.context.scene.collection.objects.link(c)
        world = o.matrix_world.copy()   # the importer's Y-up conversion sits on the parent: keep the world placement
        c.parent = None
        c.matrix_world = world
        c.hide_render = False
        target = hero.get(part, hero['hero'])
        c.parent = target
        c.matrix_parent_inverse = target.matrix_world.inverted() @ hero['hero'].matrix_world
        objs.append(c)
    bpy.context.view_layer.update()
    return objs


def lineup(out_path, before=False):
    """Row 1: each look 3/4 front; row 2: the same from behind; row 3: all six from the game camera."""
    tmp = os.path.join(BH.GEN, '_tmp')
    os.makedirs(tmp, exist_ok=True)
    looks = [d for d, _ in IDS] + list(EARS)
    imported = import_installed('B ') if before else None
    if imported:
        for o in imported.values():
            o.hide_render = True
    paths, layout = [], []
    for row, (elev, yaw) in enumerate(((14, -28), (18, 150))):
        for i, did in enumerate(looks):
            if before:
                hero, meshes = BH.spawn(f'b{row}{i}')
                hero['head-leaf'].hide_render = True   # under a costume or ears the sprout hides
                BH.pose(hero, yaw=0)
                meshes = meshes + wear_imported(hero, imported, did)
                BH.pose(hero)
            elif did.startswith('dz_'):
                hero, meshes = BH.spawn(f'l{row}{i}', did=did)
            else:
                hero, meshes = spawn_ears(f'e{row}{i}', did)
            BH.stage((260, 340), ground='#8FE06A')
            cam = BH.camera(elev, yaw)
            BH.fit(cam, [m for m in meshes if not m.hide_render], 1.1)
            paths.append(BH.render_png(os.path.join(tmp, f'lu_{row}_{i}.png')))
            layout.append((i * 260, row * 340))
            bpy.data.objects.remove(cam, do_unlink=True)
            BH.remove_tree(hero['hero'])
    crowd = []
    for i, did in enumerate(looks):
        loc = ((i - 2.5) * 2.4, 0, 0)
        if before:
            h, _ = BH.spawn(f'g{i}')
            h['head-leaf'].hide_render = True
            BH.pose(h, yaw=0)
            wear_imported(h, imported, did)
            BH.pose(h, loc=loc)
        elif did.startswith('dz_'):
            h, _ = BH.spawn(f'g{i}', did=did, loc=loc)
        else:
            h, _ = spawn_ears(f'g{i}', did, loc=loc)
        crowd.append(h)
    BH.stage((1560, 300), ground='#7DD957')
    BH.camera(51.5, 0, target=(0, 0, 0.9), ortho=16.5, distance=40)
    paths.append(BH.render_png(os.path.join(tmp, 'lu_game.png')))
    layout.append((0, 680))
    BH.composite(paths, layout, (1560, 980), out_path)
    for h in crowd:
        BH.remove_tree(h['hero'])


def closeup(did, out_path):
    hero, meshes = BH.spawn('cu', did=did)
    tmp = os.path.join(BH.GEN, '_tmp')
    paths = []
    for i, (elev, yaw) in enumerate(((10, -24), (16, 35), (20, 160))):
        BH.stage((520, 640), ground='#8FE06A')
        cam = BH.camera(elev, yaw)
        BH.fit(cam, meshes, 1.06)
        paths.append(BH.render_png(os.path.join(tmp, f'cu_{i}.png')))
        bpy.data.objects.remove(cam, do_unlink=True)
    BH.composite(paths, [(0, 0), (520, 0), (1040, 0)], (1560, 640), out_path)
    BH.remove_tree(hero['hero'])


def render_icons():
    os.makedirs(BH.ICONS, exist_ok=True)
    os.makedirs(LOOK_ICONS, exist_ok=True)
    written = {}
    for did, _ in IDS:
        hero, meshes = BH.spawn('ic', did=did)
        BH.stage((160, 160), transparent=True, world=0.6, exposure=-0.15)
        cam = BH.camera(20, -30)
        BH.fit(cam, meshes, 1.03, zmin=0.42)
        bpy.ops.render.render(write_still=False)
        path = os.path.join(BH.ICONS, did + '.webp')
        BH.save_webp_under(path, BH.ICON_LIMIT)
        written[did] = os.path.getsize(path)
        bpy.data.objects.remove(cam, do_unlink=True)
        BH.remove_tree(hero['hero'])
    elev, yaw, z, ortho = BS.ICON_FRAMES['ears']   # the mirror's ear portraits, framed like the cat and bunny ones
    for eid in EARS:
        hero, meshes = spawn_ears('ie', eid, yaw=math.radians(yaw))
        BH.stage((128, 128), transparent=True, world=0.6, exposure=-0.15)
        cam = BH.camera(elev, yaw, target=(0, 0, z))
        cam.data.ortho_scale = ortho
        bpy.ops.render.render(write_still=False)
        path = os.path.join(LOOK_ICONS, eid + '.webp')
        BH.save_webp_under(path, BH.ICON_LIMIT)
        written[eid] = os.path.getsize(path)
        bpy.data.objects.remove(cam, do_unlink=True)
        BH.remove_tree(hero['hero'])
    return written


def main():
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    unknown = set(argv) - {'--install', '--render', '--before', '--closeup'}
    if unknown:
        raise SystemExit(f'unknown arguments {sorted(unknown)}')
    if '--before' in argv:
        reset_scene()
        register()
        lineup(os.path.join(BH.PREVIEWS, 'everyday-disguises-before.webp'), before=True)
        print('before line-up written')
        return
    print('\n== everyday disguises and ears')
    report, fails = build_all()
    if fails:
        raise RuntimeError('Everyday disguise contract failures:\n  ' + '\n  '.join(fails))
    reset_scene()
    register()
    icons = render_icons()
    print('  icons', icons)
    if '--render' in argv:
        reset_scene()
        register()
        lineup(os.path.join(BH.PREVIEWS, 'everyday-disguises.webp'))
        reset_scene()
        register()
        closeup('dz_kpop', os.path.join(BH.PREVIEWS, 'everyday-kpop-closeup.webp'))
    if '--install' in argv:
        for did, _ in IDS:
            shutil.copy2(os.path.join(BH.ICONS, did + '.webp'), os.path.join(BH.PUBLIC_ICONS, did + '.webp'))
        pub_looks = os.path.join(BH.REPO, 'public', 'assets', 'icons', 'looks')
        for eid in EARS:
            shutil.copy2(os.path.join(LOOK_ICONS, eid + '.webp'), os.path.join(pub_looks, eid + '.webp'))
        subprocess.run(['node', os.path.join(BH.REPO, 'art', 'build-boat-appearance.mjs')], cwd=BH.REPO, check=True)
        print('installed')
    print('\nEveryday disguises OK')


if __name__ == '__main__':
    main()
