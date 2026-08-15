// ==========================================================================
// PANAYANA REPERTOIRE & CLOUD DRIVE CONTROLLER
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    const iframe = document.querySelector('.drive-iframe');
    const fallback = document.getElementById('driveFallback');

    // If a valid Google Drive Folder ID is configured in the iframe src, hide the fallback banner
    if (iframe && !iframe.src.includes('1exampleFolderIDPanayana')) {
        if (fallback) {
            fallback.style.display = 'none';
        }
    }
});