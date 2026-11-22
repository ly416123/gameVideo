#!/usr/bin/env python3
"""Generate a story's scene narration with the existing local Qwen3-TTS GPU model."""
import json
import os
import sys
from pathlib import Path

import soundfile as sf
import torch
from qwen_tts import Qwen3TTSModel

ROOT = Path(__file__).resolve().parents[1]
MODEL = Path('/data/code/tools/data/models/huggingface/hub/models--Qwen--Qwen3-TTS-12Hz-1.7B-CustomVoice/snapshots/0c0e3051f131929182e2c023b9537f8b1c68adfe')

def main():
    spec_path = (ROOT / sys.argv[1]).resolve()
    spec = json.loads(spec_path.read_text(encoding='utf-8'))
    if not torch.cuda.is_available():
        raise SystemExit('CUDA unavailable; refusing CPU fallback for local narration.')
    if not (MODEL / 'model.safetensors').is_file():
        raise SystemExit(f'Qwen3-TTS model file missing: {MODEL / "model.safetensors"}')
    os.environ['HF_HOME'] = '/data/code/tools/data/models/huggingface'
    os.environ['HF_HUB_OFFLINE'] = '1'
    model = Qwen3TTSModel.from_pretrained(str(MODEL), local_files_only=True, device_map='cuda:0', dtype=torch.float16, attn_implementation='sdpa')
    result = []
    for index, scene in enumerate(spec['scenes'], start=1):
        if scene.get('voiceSegments'):
            scene_duration = 0.0
            for unit_index, unit in enumerate(scene['voiceSegments'], start=1):
                output_rel = unit['voice']
                output = ROOT / 'public' / output_rel
                output.parent.mkdir(parents=True, exist_ok=True)
                label = f"{scene.get('title', f'第{index}场')}·{unit_index}/{len(scene['voiceSegments'])}"
                print(f"TTS {label}: {unit['narration']}", flush=True)
                audio, rate = model.generate_custom_voice(
                    text=unit['narration'],
                    language='Chinese',
                    speaker=spec.get('speaker', 'Uncle_Fu'),
                    instruct=unit.get('voice_instruction', spec.get('voice_instruction', '以自然、清晰的普通话讲述。')),
                )
                sf.write(output, audio[0], rate, subtype='PCM_16')
                voice_duration = len(audio[0]) / rate
                hold = float(unit.get('holdSeconds', 0.55))
                unit['voiceDurationSeconds'] = round(voice_duration, 3)
                unit['durationSeconds'] = round(voice_duration + hold, 3)
                scene_duration += voice_duration + hold
                result.append({'scene': label, 'path': str(output.relative_to(ROOT)), 'duration_seconds': round(voice_duration, 3), 'sample_rate_hz': rate, 'device': torch.cuda.get_device_name(0)})
            scene['durationSeconds'] = round(scene_duration, 3)
            scene['voiceDurationSeconds'] = round(sum(unit['voiceDurationSeconds'] for unit in scene['voiceSegments']), 3)
            continue
        output_rel = scene['voice']
        output = ROOT / 'public' / output_rel
        output.parent.mkdir(parents=True, exist_ok=True)
        label = scene.get('title') or f"{scene.get('act', '故事')}·第{index}场"
        print(f"TTS {index}/{len(spec['scenes'])}: {label}", flush=True)
        audio, rate = model.generate_custom_voice(
            text=scene['narration'],
            language='Chinese',
            speaker=spec.get('speaker', 'Uncle_Fu'),
            instruct=spec.get(
                'voice_instruction',
                '以成熟睿智、沉稳从容的讲述者口吻讲故事，语速舒缓自然，吐字清晰；不过度戏剧化，不卖萌。',
            ),
        )
        sf.write(output, audio[0], rate, subtype='PCM_16')
        duration = len(audio[0]) / rate
        scene['durationSeconds'] = round(max(scene.get('durationSeconds', 0), duration + 0.75), 3)
        scene['voiceDurationSeconds'] = round(duration, 3)
        result.append({'scene': label, 'path': str(output.relative_to(ROOT)), 'duration_seconds': round(duration, 3), 'sample_rate_hz': rate, 'device': torch.cuda.get_device_name(0)})
    spec['voice_assets'] = result
    spec_path.write_text(json.dumps(spec, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(result, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()
