// Existing code...

function clearVerseSelectionAndOutput() {
    // Clear verse selections
    // Assuming there are elements with the respective IDs or classes
    document.getElementById('verseSelect').selectedIndex = -1; // Clear selection
    document.getElementById('verseTextarea').value = ''; // Clear textarea
    document.getElementById('verseReference').innerText = ''; // Clear reference display
    document.getElementById('versePreview').innerText = ''; // Clear preview display
}

// Example change handler for bookSelect
document.getElementById('bookSelect').addEventListener('change', function() {
    // Clear previous selections and output
    clearVerseSelectionAndOutput();
    
    // Repopulate book logic here...
});

// Example change handler for chapterSelect
document.getElementById('chapterSelect').addEventListener('change', function() {
    // Clear previous selections and output
    clearVerseSelectionAndOutput();
    
    // Repopulate chapter logic here...
});

// Existing code...