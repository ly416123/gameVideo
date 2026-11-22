#!/usr/bin/env python3
"""Generate the lottery winner voice with the game's local Qwen3-TTS model."""

import argparse
import os
from pathlib import Path

import soundfile as sf
import torch
from qwen_tts import Qwen3TTSModel


ROOT = Path(__file__).resolve().parents[1]
MODEL = Path(
    "/data/code/tools/data/models/huggingface/hub/models--Qwen--Qwen3-TTS-12Hz-1.7B-CustomVoice"
    "/snapshots/0c0e3051f131929182e2c023b9537f8b1c68adfe"
)
INSTRUCTION = "用温柔、亲切、自然的绘本讲述语气，语速舒缓但不拖沓，咬字清楚，情绪随着故事轻微变化；像给孩子讲故事，不要播音腔，不要夸张表演。"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--text", default="小马过河", help="Exact words to speak")
    parser.add_argument(
        "--output", default=str(ROOT / "public/lottery-audio/winner-voice.wav")
    )
    args = parser.parse_args()

    if args.text != "小马过河":
        raise SystemExit("This lottery voice is intentionally limited to: 小马过河")
    if not (MODEL / "model.safetensors").is_file():
        raise SystemExit(f"Local Qwen3-TTS weights are missing: {MODEL}")
    if not torch.cuda.is_available():
        raise SystemExit("CUDA is unavailable; refusing to silently switch to CPU.")

    # Keep Hugging Face cache and any runtime metadata on the migrated data disk.
    os.environ["HF_HOME"] = "/data/code/tools/data/models/huggingface"
    os.environ["HF_HUB_OFFLINE"] = "1"

    print(f"Loading local Qwen3-TTS on {torch.cuda.get_device_name(0)}…", flush=True)
    model = Qwen3TTSModel.from_pretrained(
        str(MODEL),
        local_files_only=True,
        device_map="cuda:0",
        dtype=torch.float16,
        attn_implementation="sdpa",
    )
    print("Generating the exact four-character title with Serena…", flush=True)
    wavs, sample_rate = model.generate_custom_voice(
        text=args.text,
        language="Chinese",
        speaker="Serena",
        instruct=INSTRUCTION,
    )

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    sf.write(output, wavs[0], sample_rate, subtype="PCM_16")
    duration = len(wavs[0]) / sample_rate
    print(
        f"Saved {output} · {sample_rate} Hz · {duration:.2f}s · "
        f"Qwen3-TTS Serena · CUDA",
        flush=True,
    )


if __name__ == "__main__":
    main()
