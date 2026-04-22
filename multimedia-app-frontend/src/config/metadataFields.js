export const METADATA_FIELDS = {
  image: [
    { key: 'Title', label: 'Title', editable: true },
    { key: 'Artist', label: 'Artist', editable: true },
    { key: 'Keywords', label: 'Keywords', editable: true, type: 'tags' },
    { key: 'Description', label: 'Description', editable: true, type: 'textarea' },

    { key: 'ImageWidth', label: 'Width', editable: false },
    { key: 'ImageHeight', label: 'Height', editable: false },
    { key: 'FileType', label: 'File Type', editable: false },
  ],

  audio: [
    { key: 'Title', label: 'Title', editable: true },
    { key: 'Artist', label: 'Artist', editable: true },
    { key: 'Album', label: 'Album', editable: true },
    { key: 'Genre', label: 'Genre', editable: true },
    { key: 'Year', label: 'Year', editable: true },

    { key: 'Duration', label: 'Duration', editable: false },
    { key: 'Bitrate', label: 'Bitrate', editable: false },
  ],

  video: [
    { key: 'Title', label: 'Title', editable: true },
    { key: 'Comment', label: 'Comment', editable: true, type: 'textarea' },

    { key: 'ImageWidth', label: 'Width', editable: false },
    { key: 'ImageHeight', label: 'Height', editable: false },
    { key: 'Duration', label: 'Duration', editable: false },
  ],
}
