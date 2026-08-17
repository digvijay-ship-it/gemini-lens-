import math
from PIL import Image, ImageDraw, ImageFilter

def create_icon(size):
    # Render at 4x resolution for supersampled anti-aliasing
    scale = 4
    canvas_size = size * scale
    img = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Padding and rounded rect dimensions
    pad = int(canvas_size * 0.06)
    rect_box = [pad, pad, canvas_size - pad, canvas_size - pad]
    radius = int(canvas_size * 0.28)

    # 1. Gradient Background squircle
    # We create a vertical gradient
    grad = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    grad_draw = ImageDraw.Draw(grad)
    for y in range(canvas_size):
        t = y / float(canvas_size)
        # Gradient from #6366f1 (indigo) to #a855f7 (purple) to #ec4899 (pink-magenta)
        if t < 0.5:
            local_t = t * 2.0
            r = int(99 + (168 - 99) * local_t)
            g = int(102 + (85 - 102) * local_t)
            b = int(241 + (247 - 241) * local_t)
        else:
            local_t = (t - 0.5) * 2.0
            r = int(168 + (236 - 168) * local_t)
            g = int(85 + (72 - 85) * local_t)
            b = int(247 + (153 - 247) * local_t)
        grad_draw.line([(0, y), (canvas_size, y)], fill=(r, g, b, 255))

    # Mask for rounded rectangle
    mask = Image.new("L", (canvas_size, canvas_size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle(rect_box, radius=radius, fill=255)

    # Combine gradient with mask
    img.paste(grad, (0, 0), mask)

    # Subtle inner border for glassy depth
    border_draw = ImageDraw.Draw(img)
    border_draw.rounded_rectangle(rect_box, radius=radius, outline=(255, 255, 255, 60), width=int(scale * 1.5))

    # 2. Camera Glyph Drawing
    cx, cy = canvas_size // 2, int(canvas_size * 0.54)
    cam_w = int(canvas_size * 0.58)
    cam_h = int(canvas_size * 0.40)
    cam_x0 = cx - cam_w // 2
    cam_y0 = cy - cam_h // 2
    cam_x1 = cx + cam_w // 2
    cam_y1 = cy + cam_h // 2
    cam_radius = int(cam_h * 0.25)

    # Camera top bump / lens housing
    bump_w = int(cam_w * 0.36)
    bump_h = int(canvas_size * 0.08)
    bump_x0 = cx - bump_w // 2
    bump_y0 = cam_y0 - bump_h + int(scale * 2)
    bump_x1 = cx + bump_w // 2
    bump_y1 = cam_y0 + int(scale * 2)
    border_draw.rounded_rectangle([bump_x0, bump_y0, bump_x1, bump_y1], radius=int(bump_h * 0.4), fill=(255, 255, 255, 240))

    # Camera Main Body
    border_draw.rounded_rectangle([cam_x0, cam_y0, cam_x1, cam_y1], radius=cam_radius, fill=(255, 255, 255, 255))

    # Camera Lens Outer Ring
    lens_r = int(cam_h * 0.34)
    lens_cx = cx
    lens_cy = cy + int(scale * 1.5)
    border_draw.ellipse(
        [lens_cx - lens_r, lens_cy - lens_r, lens_cx + lens_r, lens_cy + lens_r],
        fill=(124, 58, 237, 255),
        outline=(255, 255, 255, 255),
        width=int(scale * 2)
    )

    # Camera Lens Inner Pupil
    inner_r = int(lens_r * 0.55)
    border_draw.ellipse(
        [lens_cx - inner_r, lens_cy - inner_r, lens_cx + inner_r, lens_cy + inner_r],
        fill=(45, 20, 90, 255)
    )

    # Lens Glint / Catchlight reflection
    glint_r = int(inner_r * 0.35)
    glint_x = lens_cx - int(inner_r * 0.35)
    glint_y = lens_cy - int(inner_r * 0.35)
    border_draw.ellipse(
        [glint_x - glint_r, glint_y - glint_r, glint_x + glint_r, glint_y + glint_r],
        fill=(255, 255, 255, 230)
    )

    # Mini flash dot on camera top right
    flash_r = int(scale * 2.5)
    flash_x = cam_x1 - int(cam_w * 0.16)
    flash_y = cam_y0 + int(cam_h * 0.22)
    border_draw.ellipse(
        [flash_x - flash_r, flash_y - flash_r, flash_x + flash_r, flash_y + flash_r],
        fill=(168, 85, 247, 255)
    )

    # 3. Gemini Sparkle (4-point star in top-left)
    star_cx = int(canvas_size * 0.26)
    star_cy = int(canvas_size * 0.24)
    star_size = int(canvas_size * 0.16)

    def draw_star(scx, scy, r, color):
        points = []
        for i in range(8):
            angle = i * math.pi / 4.0
            cur_r = r if i % 2 == 0 else r * 0.32
            x = scx + cur_r * math.cos(angle)
            y = scy + cur_r * math.sin(angle)
            points.append((x, y))
        border_draw.polygon(points, fill=color)

    # Outer glow / shadow for star
    draw_star(star_cx, star_cy, star_size, (255, 225, 77, 255))
    draw_star(star_cx, star_cy, int(star_size * 0.65), (255, 255, 255, 255))

    # Downscale with high-quality Lanczos resampling
    final_icon = img.resize((size, size), Image.Resampling.LANCZOS)
    return final_icon

import os
os.makedirs("icons", exist_ok=True)
for s in [16, 32, 48, 128]:
    icon = create_icon(s)
    icon.save(f"icons/icon{s}.png")
    print(f"Generated icons/icon{s}.png ({s}x{s})")
