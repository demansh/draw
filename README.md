# Упражнения для рисования

Статическая лента YouTube-роликов с упражнениями для рисования.

Сайт: https://demansh.github.io/draw/

## Как добавить видео

Вставьте ссылку строкой в массив `VIDEO_LINKS` в файле `videos.js`.
Поддерживаются ссылки `youtube.com/shorts/…`, `youtu.be/…` и `youtube.com/watch?v=…`.

## Локальный запуск

```
python3 -m http.server 8080
```

Откройте http://localhost:8080 (через `file://` встроенные видео YouTube не проигрываются).
