function updateVerseInput() {
    // Logic to reuse verseSelect change handler logic
    const selectedVerses = [...verseSelect.selectedOptions].map(option => option.value);
    if (selectedVerses.length > 0 && verseInput.value.trim() !== '') {
        const selectedLanguage = languageSelect.value;
        // Logic to retrigger translation using selectedLanguage
        // This assumes you have a function that handles translation
        translateVerses(selectedVerses, selectedLanguage);
    }
}

bookSelect.addEventListener('change', function() {
    // Clear and repopulate verseSelect
    clearAndPopulateVerseSelect();
    updateVerseInput();  // Call the helper function
});

chapterSelect.addEventListener('change', function() {
    // Clear and repopulate verseSelect
    clearAndPopulateVerseSelect();
    updateVerseInput();  // Call the helper function
});

function clearAndPopulateVerseSelect() {
    // Logic to clear and repopulate verseSelect
    // ...
}