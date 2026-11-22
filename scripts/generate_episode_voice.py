#!/usr/bin/env python3
"""Generate and archive story episode narration with the local game Qwen voice."""

import json
import os
from pathlib import Path

import soundfile as sf
import torch
from qwen_tts import Qwen3TTSModel


ROOT = Path(__file__).resolve().parents[1]
PROJECT = ROOT / "content/stories/xiaoma-guohe"
MODEL = Path(
    "/data/code/tools/data/models/huggingface/hub/models--Qwen--Qwen3-TTS-12Hz-1.7B-CustomVoice"
    "/snapshots/0c0e3051f131929182e2c023b9537f8b1c68adfe"
)


def main() -> None:
    voice_spec = json.loads((PROJECT / "voiceover.json").read_text(encoding="utf-8"))
    if not torch.cuda.is_available():
        raise SystemExit("CUDA is unavailable; refusing to silently switch to CPU.")
    if not (MODEL / "model.safetensors").is_file():
        raise SystemExit(f"Local Qwen3-TTS weights are missing: {MODEL}")

    os.environ["HF_HOME"] = "/data/code/tools/data/models/huggingface"
    os.environ["HF_HUB_OFFLINE"] = "1"
    print(f"Loading Qwen3-TTS on {torch.cuda.get_device_name(0)}…", flush=True)
    model = Qwen3TTSModel.from_pretrained(
        str(MODEL),
        local_files_only=True,
        device_map="cuda:0",
        dtype=torch.float16,
        attn_implementation="sdpa",
    )

    generated = []
    for segment in voice_spec["segments"]:
        output = ROOT / segment["output"]
        output.parent.mkdir(parents=True, exist_ok=True)
        print(f"Generating {segment['id']}…", flush=True)
        wavs, sample_rate = model.generate_custom_voice(
            text=segment["text"],
            language=voice_spec["language"],
            speaker=voice_spec["speaker"],
            instruct=voice_spec["instruction"],
        )
        sf.write(output, wavs[0], sample_rate, subtype="PCM_16")
        generated.append(
            {
                **segment,
                "sample_rate_hz": sample_rate,
                "duration_seconds": round(len(wavs[0]) / sample_rate, 3),
                "device": torch.cuda.get_device_name(0),
            }
        )
        print(f"  Saved {output} ({generated[-1]['duration_seconds']:.2f}s)", flush=True)

    metadata = {**voice_spec, "segments": generated}
    (PROJECT / "voiceover.generated.json").write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"Archived voice metadata in {PROJECT / 'voiceover.generated.json'}", flush=True)


if __name__ == "__main__":
    main()
