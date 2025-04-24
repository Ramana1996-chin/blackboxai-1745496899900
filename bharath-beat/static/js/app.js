// Initialize the application
let currentPage = 1;
let loading = false;
let currentCategory = 'local';

document.addEventListener('DOMContentLoaded', () => {
    // Get user's location
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            fetchLocalNews(latitude, longitude);
        }, error => {
            console.error("Error getting location:", error);
            fetchLocalNews(null, null);
        });
    }

    // Dark mode toggle
    const darkModeToggle = document.querySelector('.fa-moon').parentElement;
    darkModeToggle.addEventListener('click', toggleDarkMode);

    // Category selection
    const categoryButtons = document.querySelectorAll('.container button');
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            categoryButtons.forEach(btn => {
                btn.classList.remove('text-blue-800', 'font-medium');
                btn.classList.add('text-gray-600');
            });
            button.classList.remove('text-gray-600');
            button.classList.add('text-blue-800', 'font-medium');
            
            currentCategory = button.textContent.toLowerCase();
            currentPage = 1;
            document.getElementById('newsFeed').innerHTML = '';
            fetchNewsByCategory(currentCategory);
        });
    });

    // Infinite scroll
    window.addEventListener('scroll', () => {
        if (loading) return;
        
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 500) {
            currentPage++;
            if (currentCategory === 'local') {
                fetchLocalNews(null, null, true);
            } else {
                fetchNewsByCategory(currentCategory, true);
            }
        }
    });
});

function toggleDarkMode() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    
    if (isDark) {
        document.body.classList.add('bg-gray-900', 'text-white');
        document.querySelector('header').classList.remove('bg-white');
        document.querySelector('header').classList.add('bg-gray-800');
        document.querySelectorAll('.news-card').forEach(card => {
            card.classList.remove('bg-white');
            card.classList.add('bg-gray-800');
        });
    } else {
        document.body.classList.remove('bg-gray-900', 'text-white');
        document.querySelector('header').classList.remove('bg-gray-800');
        document.querySelector('header').classList.add('bg-white');
        document.querySelectorAll('.news-card').forEach(card => {
            card.classList.remove('bg-gray-800');
            card.classList.add('bg-white');
        });
    }
}

async function fetchLocalNews(lat, lon, append = false) {
    try {
        loading = true;
        showLoadingSpinner();
        
        const response = await fetch(`/api/news/local?lat=${lat}&lon=${lon}&page=${currentPage}`);
        if (!response.ok) {
            throw new Error('Failed to fetch news');
        }
        const news = await response.json();
        displayNews(news, append);
    } catch (error) {
        console.error('Error fetching local news:', error);
        displayError('Failed to load news. Please try again later.');
    } finally {
        loading = false;
        hideLoadingSpinner();
    }
}

async function fetchNewsByCategory(category, append = false) {
    try {
        loading = true;
        showLoadingSpinner();
        
        const response = await fetch(`/api/news/category/${category}?page=${currentPage}`);
        if (!response.ok) {
            throw new Error('Failed to fetch news');
        }
        const news = await response.json();
        displayNews(news, append);
    } catch (error) {
        console.error('Error fetching news by category:', error);
        displayError('Failed to load news. Please try again later.');
    } finally {
        loading = false;
        hideLoadingSpinner();
    }
}

function showLoadingSpinner() {
    document.getElementById('loadingSpinner').classList.add('visible');
}

function hideLoadingSpinner() {
    document.getElementById('loadingSpinner').classList.remove('visible');
}

function displayError(message) {
    const newsContainer = document.getElementById('newsFeed');
    newsContainer.innerHTML = `
        <div class="news-card p-6">
            <div class="text-center text-red-600">
                <i class="fas fa-exclamation-circle fa-2x mb-2"></i>
                <p class="mt-2">${message}</p>
            </div>
        </div>
    `;
}

function displayNews(newsItems, append = false) {
    const newsContainer = document.getElementById('newsFeed');
    if (!newsItems || newsItems.length === 0) {
        if (!append) {
            newsContainer.innerHTML = `
                <div class="news-card p-6">
                    <div class="text-center text-gray-600">
                        <i class="fas fa-newspaper fa-2x mb-2"></i>
                        <p>వార్తలు ఏవీ దొరకలేదు</p>
                    </div>
                </div>
            `;
        }
        return;
    }

    const newsHTML = newsItems.map(news => `
        <div class="news-card p-4">
            <img src="${news.image}" alt="${news.title}" class="w-full h-48 object-cover rounded-lg mb-4" onerror="this.src='https://via.placeholder.com/400x200?text=No+Image'">
            <div class="space-y-3">
                <div class="flex items-center text-sm text-gray-500">
                    <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded">${news.category}</span>
                    <span class="ml-2">${news.time}</span>
                </div>
                <h2 class="font-poppins font-semibold text-xl">${news.title}</h2>
                <p class="text-gray-600">${news.description}</p>
                <div class="flex items-center justify-between pt-2">
                    <span class="text-sm text-gray-500">Source: ${news.source}</span>
                    <div class="flex space-x-4">
                        <a href="${news.url}" target="_blank" class="text-gray-600 hover:text-blue-800">
                            <i class="fas fa-external-link-alt"></i>
                        </a>
                        <button onclick="toggleLike('${btoa(news.url)}')" class="text-gray-600 hover:text-blue-800">
                            <i class="fas fa-thumbs-up"></i>
                            <span class="text-sm ml-1">0</span>
                        </button>
                        <button onclick="toggleDislike('${btoa(news.url)}')" class="text-gray-600 hover:text-red-600">
                            <i class="fas fa-thumbs-down"></i>
                            <span class="text-sm ml-1">0</span>
                        </button>
                        <button onclick="openComments('${btoa(news.url)}')" class="text-gray-600 hover:text-blue-800">
                            <i class="fas fa-comment"></i>
                            <span class="text-sm ml-1">0</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    if (append) {
        newsContainer.insertAdjacentHTML('beforeend', newsHTML);
    } else {
        newsContainer.innerHTML = newsHTML;
    }

    // Apply dark mode if active
    if (document.body.classList.contains('dark')) {
        document.querySelectorAll('.news-card').forEach(card => {
            card.classList.remove('bg-white');
            card.classList.add('bg-gray-800');
        });
    }
}

// Interaction functions
let currentNewsId = null;
const newsInteractions = {};

function toggleLike(newsId) {
    const interaction = newsInteractions[newsId] || { likes: 0, dislikes: 0, comments: [], userLiked: false, userDisliked: false };
    newsInteractions[newsId] = interaction;

    if (interaction.userDisliked) {
        interaction.userDisliked = false;
        interaction.dislikes--;
    }
    if (interaction.userLiked) {
        interaction.userLiked = false;
        interaction.likes--;
    } else {
        interaction.userLiked = true;
        interaction.likes++;
    }
    updateNewsCard(newsId);
}

function toggleDislike(newsId) {
    const interaction = newsInteractions[newsId] || { likes: 0, dislikes: 0, comments: [], userLiked: false, userDisliked: false };
    newsInteractions[newsId] = interaction;

    if (interaction.userLiked) {
        interaction.userLiked = false;
        interaction.likes--;
    }
    if (interaction.userDisliked) {
        interaction.userDisliked = false;
        interaction.dislikes--;
    } else {
        interaction.userDisliked = true;
        interaction.dislikes++;
    }
    updateNewsCard(newsId);
}

function openComments(newsId) {
    currentNewsId = newsId;
    const modal = document.getElementById('commentsModal');
    const commentsList = document.getElementById('commentsList');
    const interaction = newsInteractions[newsId] || { comments: [] };
    
    commentsList.innerHTML = interaction.comments.map(comment => `
        <div class="border-b last:border-0 py-3">
            <p class="text-gray-800">${comment}</p>
        </div>
    `).join('') || '<p class="text-gray-500 text-center py-4">No comments yet</p>';
    
    modal.classList.remove('hidden');
}

function closeCommentsModal() {
    document.getElementById('commentsModal').classList.add('hidden');
    currentNewsId = null;
}

function addComment() {
    if (!currentNewsId) return;
    
    const input = document.getElementById('commentInput');
    const comment = input.value.trim();
    
    if (comment) {
        const interaction = newsInteractions[currentNewsId] || { likes: 0, dislikes: 0, comments: [], userLiked: false, userDisliked: false };
        newsInteractions[currentNewsId] = interaction;
        interaction.comments.push(comment);
        input.value = '';
        
        // Update comments list
        const commentsList = document.getElementById('commentsList');
        commentsList.innerHTML = interaction.comments.map(c => `
            <div class="border-b last:border-0 py-3">
                <p class="text-gray-800">${c}</p>
            </div>
        `).join('');
        
        // Update comment count in the news card
        updateNewsCard(currentNewsId);
    }
}

function updateNewsCard(newsId) {
    const interaction = newsInteractions[newsId];
    const article = document.querySelector(`[onclick*="${newsId}"]`).closest('.news-card');
    if (article) {
        const likeBtn = article.querySelector('.fa-thumbs-up').parentElement;
        const dislikeBtn = article.querySelector('.fa-thumbs-down').parentElement;
        const commentBtn = article.querySelector('.fa-comment').parentElement;
        
        likeBtn.classList.toggle('liked', interaction.userLiked);
        dislikeBtn.classList.toggle('disliked', interaction.userDisliked);
        
        likeBtn.querySelector('span').textContent = interaction.likes;
        dislikeBtn.querySelector('span').textContent = interaction.dislikes;
        commentBtn.querySelector('span').textContent = interaction.comments.length;
    }
}
