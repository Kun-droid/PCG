document.addEventListener('DOMContentLoaded', () => {
    const iframe = document.querySelector('.drive-iframe');
    const fallback = document.getElementById('driveFallback');

    // If a valid Google Drive Folder ID is configured in the iframe src, hide the fallback banner[cite: 30]
    if (iframe && fallback && !iframe.src.includes('1exampleFolderIDPanayana')) {
        fallback.style.display = 'none';
    }
});