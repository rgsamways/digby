"""Convert OGS shapefiles to GeoJSON for use as static map layers."""

import json
import math
import shapefile

BASEDIR = "c:/dev/digby"


def douglas_peucker(points, epsilon):
    if len(points) < 3:
        return points
    dmax = 0
    idx = 0
    end = len(points) - 1
    for i in range(1, end):
        px, py = points[i]
        ax, ay = points[0]
        bx, by = points[end]
        dx, dy = bx - ax, by - ay
        length = math.hypot(dx, dy)
        if length == 0:
            d = math.hypot(px - ax, py - ay)
        else:
            d = abs(dx * (ay - py) - (ax - px) * dy) / length
        if d > dmax:
            dmax, idx = d, i
    if dmax > epsilon:
        left = douglas_peucker(points[:idx + 1], epsilon)
        right = douglas_peucker(points[idx:], epsilon)
        return left[:-1] + right
    return [points[0], points[end]]


def simplify_ring(ring, epsilon):
    # GeoJSON rings: first == last (closed). Strip last, simplify open line, re-close.
    pts = list(ring)
    if len(pts) > 1 and pts[0] == pts[-1]:
        pts = pts[:-1]
    simplified = douglas_peucker(pts, epsilon)
    if len(simplified) < 3:
        return list(ring)  # degenerate — keep original
    simplified.append(simplified[0])  # re-close
    return simplified


def round_coords(obj, precision=4):
    if isinstance(obj, (int, float)):
        return round(obj, precision)
    if isinstance(obj, list):
        return [round_coords(v, precision) for v in obj]
    return obj


def shp_to_geojson(shp_path, out_path, epsilon=0.0, field_map=None):
    sf = shapefile.Reader(shp_path, encoding="latin-1")
    fields = [f[0] for f in sf.fields[1:]]  # skip DeletionFlag
    features = []

    for sr in sf.shapeRecords():
        rec = dict(zip(fields, sr.record))
        if field_map:
            props = {new: rec.get(old) for old, new in field_map.items() if rec.get(old) is not None}
        else:
            props = {k: v for k, v in rec.items() if v is not None and v != ""}

        geom = sr.shape.__geo_interface__
        if epsilon > 0 and geom["type"] in ("Polygon", "MultiPolygon"):
            if geom["type"] == "Polygon":
                coords = [simplify_ring(list(map(list, ring)), epsilon) for ring in geom["coordinates"]]
                geom = {"type": "Polygon", "coordinates": round_coords(coords)}
            else:
                polys = [
                    [simplify_ring(list(map(list, ring)), epsilon) for ring in poly]
                    for poly in geom["coordinates"]
                ]
                geom = {"type": "MultiPolygon", "coordinates": round_coords(polys)}
        else:
            geom = {**geom, "coordinates": round_coords(geom["coordinates"])}

        features.append({"type": "Feature", "geometry": geom, "properties": props})

    fc = {"type": "FeatureCollection", "features": features}
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(fc, f, separators=(",", ":"))
    print(f"Wrote {len(features)} features -> {out_path}")


# OMI — Ontario Mineral Inventory (points — strip to only needed fields)
shp_to_geojson(
    f"{BASEDIR}/OMI/OMI.shp",
    f"{BASEDIR}/frontend/public/geodata/omi.geojson",
    epsilon=0,
    field_map={"NAME": "NAME", "STATUS": "STATUS", "P_COMMOD": "P_COMMOD", "MDI_IDENT": "MDI_IDENT"},
)

# Geopoly — Bedrock geology polygons (strip fields + simplify aggressively for web)
shp_to_geojson(
    f"{BASEDIR}/MRD126-REVISION1/MRD126-REV1/ShapeFiles/Geology/Geopoly.shp",
    f"{BASEDIR}/frontend/public/geodata/bedrock.geojson",
    epsilon=0.05,  # ~5km tolerance — fine at Ontario overview scale; gzip brings to ~2MB
    field_map={
        "UNITNAME_P": "UNITNAME_P",
        "PROVINCE_P": "PROVINCE_P",
        "ERA_P": "ERA_P",
        "ROCKTYPE_P": "ROCKTYPE_P",
    },
)
