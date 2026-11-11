#!/usr/bin/env python3
"""Register a YouTube link or copy a local showcase video into the site."""
import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import re
import shutil
import sys
import uuid
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / 'videos.json'
VIDEO_DIR = ROOT / 'videos'
SUPPORTED = {'.mp4', '.webm', '.ogv'}
MAX_SIZE = 100 * 1024 * 1024
YOUTUBE_HOSTS = {'youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be', 'www.youtu.be', 'youtube-nocookie.com', 'www.youtube-nocookie.com'}
VIDEO_ID = re.compile(r'^[A-Za-z0-9_-]{11}$')


def youtube_id_from_url(value):
    value = value.strip()
    if VIDEO_ID.fullmatch(value):
        return value
    if '://' not in value:
        value = 'https://' + value
    parsed = urlparse(value)
    host = (parsed.hostname or '').lower()
    if parsed.scheme not in {'http', 'https'} or host not in YOUTUBE_HOSTS:
        raise ValueError('Use a YouTube watch, Shorts, live, embed, or youtu.be link.')
    parts = parsed.path.strip('/').split('/')
    if host in {'youtu.be', 'www.youtu.be'}:
        video_id = parts[0]
    elif parts[0] == 'watch':
        video_id = parse_qs(parsed.query).get('v', [''])[0]
    elif parts[0] in {'shorts', 'live', 'embed'} and len(parts) > 1:
        video_id = parts[1]
    else:
        video_id = ''
    if not VIDEO_ID.fullmatch(video_id):
        raise ValueError('Could not find a valid YouTube video ID in that link.')
    return video_id


def main():
    parser = argparse.ArgumentParser(description='Add a video to the work showcase.')
    parser.add_argument('file', nargs='?', type=Path, help='Path to an MP4, WebM, or Ogg video')
    parser.add_argument('--youtube', metavar='URL', help='YouTube video link or 11-character video ID')
    parser.add_argument('--title', help='Short title shown on the video thumbnail')
    parser.add_argument('--description', help='Description shown below the video')
    parser.add_argument('--poster', type=Path, help='Optional JPG, PNG, or WebP thumbnail')
    args = parser.parse_args()

    if bool(args.file) == bool(args.youtube):
        parser.error('Provide either a video file or --youtube URL, not both.')
    if args.youtube:
        if args.poster:
            parser.error('YouTube videos use their YouTube thumbnail; --poster is for local videos.')
        try:
            video_id = youtube_id_from_url(args.youtube)
        except ValueError as error:
            parser.error(str(error))
    else:
        source = args.file.expanduser().resolve()
        if not source.is_file():
            parser.error(f'Video not found: {source}')
        if source.suffix.lower() not in SUPPORTED:
            parser.error('Use an MP4, WebM, or Ogg video.')
        if source.stat().st_size >= MAX_SIZE:
            parser.error('The video must be smaller than 100 MiB for a normal GitHub push. Compress it or use an external host.')
    title = (args.title or input('Video title: ')).strip()
    description = (args.description or input('Video description: ')).strip()
    if not title or not description:
        parser.error('Title and description are required.')

    poster = None
    if args.poster:
        poster = args.poster.expanduser().resolve()
        if not poster.is_file() or poster.suffix.lower() not in {'.jpg', '.jpeg', '.png', '.webp'}:
            parser.error('Poster must be an existing JPG, PNG, or WebP image.')

    entries = json.loads(CATALOG.read_text(encoding='utf-8'))
    if not isinstance(entries, list):
        parser.error('videos.json must contain a list.')
    if args.youtube:
        if any(entry.get('youtubeId') == video_id for entry in entries):
            parser.error('That YouTube video is already in the showcase.')
        entries.append({
            'id': video_id,
            'type': 'youtube',
            'youtubeId': video_id,
            'title': title,
            'description': description,
            'addedAt': datetime.now(timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z')
        })
        CATALOG.write_text(json.dumps(entries, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print(f'Added YouTube video: {title}')
        print('To publish: git add videos.json && git commit -m "Add showcase video" && git push origin main')
        return
    slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')[:45] or 'video'
    unique = uuid.uuid4().hex[:8]
    stem = f'{slug}-{unique}'
    VIDEO_DIR.mkdir(exist_ok=True)
    destination = VIDEO_DIR / f'{stem}{source.suffix.lower()}'
    shutil.copy2(source, destination)
    entry = {
        'id': stem,
        'type': 'local',
        'title': title,
        'description': description,
        'src': f'videos/{destination.name}',
        'addedAt': datetime.now(timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z')
    }
    if poster:
        poster_destination = VIDEO_DIR / f'{stem}{poster.suffix.lower()}'
        shutil.copy2(poster, poster_destination)
        entry['poster'] = f'videos/{poster_destination.name}'
    entries.append(entry)
    CATALOG.write_text(json.dumps(entries, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Added {title} as {destination.relative_to(ROOT)}')
    print('To publish: git add videos.json videos/ && git commit -m "Add showcase video" && git push origin main')


if __name__ == '__main__':
    try:
        main()
    except (OSError, json.JSONDecodeError) as error:
        print(f'Could not add video: {error}', file=sys.stderr)
        sys.exit(1)
