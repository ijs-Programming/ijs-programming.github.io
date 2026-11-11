# ijs Programming portfolio

Static GitHub Pages site showcasing my work.

## Add a YouTube video

Run this from the repository folder, using your video's YouTube link:

```bash
python3 scripts/add_video.py --youtube "https://www.youtube.com/watch?v=VIDEO_ID"
```

The helper asks for a title and description, then adds the link to `videos.json`. It accepts normal YouTube, `youtu.be`, Shorts, and live video links. The video plays inside the site using an embedded player; it still streams from YouTube. Publish it with:

```bash
git add videos.json
git commit -m "Add showcase video"
git push origin main
```

## Add a local video file

Run this from the repository folder:

```bash
python3 scripts/add_video.py "/path/to/your-video.mp4"
```

The helper asks for a title and description. It copies the file into `videos/` and adds it to `videos.json`. You can add a thumbnail with `--poster "/path/to/thumbnail.jpg"`. MP4 encoded with H.264 video and AAC audio is the most widely supported format.

Then publish it:

```bash
git add videos.json videos/
git commit -m "Add showcase video"
git push origin main
```

The gallery sorts by the time each video was added, whether it is a YouTube link or a local file. The newest video appears first with a **NEW!** label and highlighted border. Local videos use the browser's built-in player.

GitHub rejects individual files of 100 MiB or more in normal Git pushes; the helper checks that limit. For larger videos, compress them first or use a video host. [GitHub file size documentation](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github)
