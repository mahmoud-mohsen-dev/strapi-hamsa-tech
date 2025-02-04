const CKEConfig = () => ({
  presets: {
    default: {
      styles: `
                --ck-focus-ring:3px dashed #5CB176;

                .ck.ck-content.ck-editor__editable {
                  &.ck-focused:not(.ck-editor__nested-editable) {
                    border: var(--ck-focus-ring) !important;
                  }
                }
                .ck.ck-content.ck-editor__editable.ck-rounded-corners.ck-editor__editable_inline.ck-blurred{
                  min-height: 400px;
                  max-height: 400px;
                }
                .ck.ck-content.ck-editor__editable.ck-rounded-corners.ck-editor__editable_inline.ck-focused{
                  min-height: 400px;
                  max-height: 1700px;
                }
            `,
      editorConfig: {
        plugins: [
          globalThis.SH_CKE.Bold,
          globalThis.SH_CKE.Italic,
          globalThis.SH_CKE.Essentials,
          globalThis.SH_CKE.Heading,
          globalThis.SH_CKE.Image,
          globalThis.SH_CKE.ImageCaption,
          globalThis.SH_CKE.ImageStyle,
          globalThis.SH_CKE.ImageToolbar,
          globalThis.SH_CKE.Link,
          globalThis.SH_CKE.List,
          globalThis.SH_CKE.Paragraph,
          globalThis.SH_CKE.StrapiMediaLib,
          globalThis.SH_CKE.StrapiUploadAdapter
        ],
        toolbar: [
          'heading',
          '|',
          'bold',
          'italic',
          'link',
          'bulletedList',
          'numberedList',
          '|',
          'strapiMediaLib',
          'insertTable',
          '|',
          'undo',
          'redo'
        ]
      }
    }
  }
});
