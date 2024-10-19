document.addEventListener('DOMContentLoaded', function() {
    const enableSwitch = document.getElementById('enableExtension');
    const titleElement = document.getElementById('title');
    const ratingElement = document.getElementById('rating');
    const addButton = document.getElementById('addButton');
    const deleteButton = document.getElementById('deleteButton');
    const clearButton = document.getElementById('clearButton');
    const movieList = document.getElementById('movieList');

    let currentMovie = null;
    let movieListArray = [];

    // Load extension state and movie list
    chrome.storage.sync.get(['enabled', 'movieList'], function(result) {
        enableSwitch.checked = result.enabled || false;
        movieListArray = result.movieList || [];
        sortMovieList();
        updateMovieList();
    });

    // Enable/disable extension
    enableSwitch.addEventListener('change', function() {
        chrome.storage.sync.set({enabled: this.checked});
    });

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.action === 'updatePopup') {
            updatePopup(request.title, request.rating);
        }
    });

    // Check for current movie info when popup opens
    chrome.storage.local.get('currentMovie', function(result) {
        if (result.currentMovie) {
            updatePopup(result.currentMovie.title, result.currentMovie.rating);
        }
    });

    function updatePopup(title, rating) {
        titleElement.textContent = title;
        ratingElement.textContent = rating;
        currentMovie = { title, rating };
        
        // Extract the numeric rating
        const numericRating = parseFloat(rating.split(':')[1]);
        
        // Disable add button if rating is not a number or if the list is full
        addButton.disabled = isNaN(numericRating) || movieListArray.length >= 10;
    }

    addButton.addEventListener('click', function() {
        if (currentMovie && !movieListArray.some(movie => movie.title === currentMovie.title)) {
            movieListArray.push(currentMovie);
            sortMovieList();
            chrome.storage.sync.set({movieList: movieListArray});
            updateMovieList();
        }
    });

    deleteButton.addEventListener('click', function() {
        if (movieListArray.length > 0) {
            const selectedMovies = document.querySelectorAll('#movieList input[type="checkbox"]:checked');
            if (selectedMovies.length > 0) {
                // Create a new array with non-selected movies
                movieListArray = movieListArray.filter((movie, index) => {
                    return !Array.from(selectedMovies).some(checkbox => parseInt(checkbox.dataset.index) === index);
                });
                chrome.storage.sync.set({movieList: movieListArray});
                updateMovieList();
            } else {
                alert('Please select at least one movie to delete.');
            }
        } else {
            alert('The movie list is empty.');
        }
    });

    clearButton.addEventListener('click', function() {
        movieListArray = [];
        chrome.storage.sync.set({movieList: movieListArray});
        updateMovieList();
    });

    function sortMovieList() {
        movieListArray.sort((a, b) => {
            const ratingA = parseFloat(a.rating.split(':')[1]) || 0;
            const ratingB = parseFloat(b.rating.split(':')[1]) || 0;
            return ratingB - ratingA;
        });
    }

    function updateMovieList() {
        movieList.innerHTML = '';
        movieListArray.forEach((movie, index) => {
            const li = document.createElement('li');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.dataset.index = index;
            li.appendChild(checkbox);
            li.appendChild(document.createTextNode(`${movie.title} - ${movie.rating}`));
            movieList.appendChild(li);
        });
        
        // Update add button state
        const currentRating = currentMovie ? parseFloat(currentMovie.rating.split(':')[1]) : NaN;
        addButton.disabled = isNaN(currentRating) || movieListArray.length >= 10;
    }
});
