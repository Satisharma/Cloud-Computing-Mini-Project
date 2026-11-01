document.addEventListener('DOMContentLoaded', () => {

    // --- Firebase Integration ---
    const firebaseConfig = {
        apiKey: "AIzaSyBdQVAxTXqj9BWHjkfacevow5_YH68YuSo",
        authDomain: "apna-aasra.firebaseapp.com",
        projectId: "apna-aasra",
        storageBucket: "apna-aasra.firebasestorage.app",
        messagingSenderId: "545594808621",
        appId: "1:545594808621:web:4a3ae038d3a862db525ba4",
        measurementId: "G-6CT5F0JDQM"
    };

    if (typeof firebase !== 'undefined') {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
    } else {
        console.error("Firebase SDK not loaded. Check script imports.");
        return;
    }

    const db = firebase.firestore();
    const auth = firebase.auth();

    // --- DYNAMICALLY LOAD & FILTER PG LISTINGS FROM FIREBASE ---
    const pgListingsGrid = document.getElementById('listings-grid');
    if (pgListingsGrid) {
        const pgFilterControls = document.querySelectorAll('.filter-sidebar input');
        const heroSearchInput = document.getElementById('hero-search-input');
        const heroSearchBtn = document.getElementById('hero-search-btn');

        const renderPgListings = (docs) => {
            pgListingsGrid.innerHTML = '';
            if (docs.length === 0) {
                pgListingsGrid.innerHTML = '<p style="color: var(--text-secondary);">No accommodations match your criteria.</p>';
                return;
            }
            docs.forEach((doc) => {
                const listing = doc.data();
                const pgCard = `
                    <div class="pg-card">
                        <img src="${listing.imageUrl || 'https://placehold.co/300x200/282828/F39C12?text=Apna+Aasra'}" alt="${listing.name || 'PG'}">
                        <div class="card-content">
                            <h3>${listing.name || 'Unnamed Property'}</h3>
                            <p class="location">${listing.location || 'Location not specified'}</p>
                            <p class="price">₹${listing.price || 0} / month</p>
                            <a href="details.html?type=pg&id=${doc.id}" class="details-button">View Details</a>
                        </div>
                    </div>
                `;
                pgListingsGrid.innerHTML += pgCard;
            });
        };

        const fetchAndDisplayPgListings = () => {
            pgListingsGrid.innerHTML = '<p style="color: var(--text-secondary);">Filtering accommodations...</p>';
            const priceSlider = document.getElementById('price-range');
            const maxPrice = priceSlider ? parseInt(priceSlider.value, 10) : 15000;
            const roomTypes = Array.from(document.querySelectorAll('input[name="room"]:checked')).map(el => el.value);
            const searchQuery = heroSearchInput ? heroSearchInput.value.trim().toLowerCase() : '';

            let query = db.collection("pg_listings").where("price", "<=", maxPrice);
            query.get().then((querySnapshot) => {
                let listings = querySnapshot.docs;
                if (roomTypes.length > 0) {
                    listings = listings.filter(doc => roomTypes.includes(doc.data().roomType));
                }
                if (searchQuery.length > 0) {
                    listings = listings.filter(doc => {
                        const data = doc.data();
                        const name = (data.name || '').toLowerCase();
                        const loc = (data.location || '').toLowerCase();
                        return name.includes(searchQuery) || loc.includes(searchQuery);
                    });
                }
                renderPgListings(listings);
            }).catch((error) => {
                console.error("Error getting PG documents: ", error);
                pgListingsGrid.innerHTML = '<p style="color: var(--text-secondary);">Could not load listings. Please try again.</p>';
            });
        };

        fetchAndDisplayPgListings();

        pgFilterControls.forEach(control => {
            control.addEventListener('change', fetchAndDisplayPgListings);
        });

        if (heroSearchBtn && heroSearchInput) {
            heroSearchBtn.addEventListener('click', (e) => {
                e.preventDefault();
                fetchAndDisplayPgListings();
            });
            heroSearchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    fetchAndDisplayPgListings();
                }
            });
        }
    }

    // --- DYNAMICALLY LOAD & FILTER TIFFIN LISTINGS FROM FIREBASE ---
    const tiffinListingsGrid = document.getElementById('tiffin-listings-grid');
    if (tiffinListingsGrid) {
        const tiffinFilterControls = document.querySelectorAll('.filter-sidebar input');
        const renderTiffinListings = (docs) => {
            tiffinListingsGrid.innerHTML = '';
            if (docs.length === 0) {
                tiffinListingsGrid.innerHTML = '<p style="color: var(--text-secondary);">No tiffin services match your criteria.</p>';
                return;
            }
            docs.forEach((doc) => {
                const listing = doc.data();
                let tagsHtml = '';
                if (listing.cuisineType) {
                    const cuisine = listing.cuisineType.toLowerCase();
                    if (cuisine === 'veg' || cuisine === 'both') {
                        tagsHtml += '<span class="tag veg">Veg</span>';
                    }
                    if (cuisine === 'non-veg' || cuisine === 'both') {
                        tagsHtml += '<span class="tag non-veg">Non-Veg</span>';
                    }
                }

                const tiffinCard = `
                    <div class="provider-card">
                        <img src="${listing.imageUrl || 'https://placehold.co/320x200/282828/F39C12?text=Tiffin+Service'}" alt="${listing.name || 'Tiffin'}">
                        <div class="provider-content">
                            <h3>${listing.name || 'Tiffin Service'}</h3>
                            <div class="provider-tags">
                                ${tagsHtml}
                            </div>
                            <p class="description">${listing.location || 'Location not specified'}</p>
                            <div class="provider-footer">
                                <span class="price">₹${listing.price || 0} / month</span>
                                <a href="details.html?type=tiffin&id=${doc.id}" class="details-button">View Details</a>
                            </div>
                        </div>
                    </div>
                `;
                tiffinListingsGrid.innerHTML += tiffinCard;
            });
        };

        const fetchAndDisplayTiffins = () => {
            tiffinListingsGrid.innerHTML = '<p style="color: var(--text-secondary);">Filtering tiffin services...</p>';
            const priceSlider = document.getElementById('tiffin-price-range');
            const maxPrice = priceSlider ? parseInt(priceSlider.value, 10) : 6000;
            const cuisineTypes = Array.from(document.querySelectorAll('input[name="cuisine"]:checked')).map(el => el.value);

            let query = db.collection("tiffin_listings").where("price", "<=", maxPrice);
            query.get().then((querySnapshot) => {
                let listings = querySnapshot.docs;
                if (cuisineTypes.length > 0) {
                    listings = listings.filter(doc => {
                        const listingData = doc.data();
                        if (!listingData.cuisineType) return false; 
                        const listingCuisine = listingData.cuisineType.toLowerCase();
                        if (listingCuisine === 'both') return true;
                        return cuisineTypes.includes(listingCuisine);
                    });
                }
                renderTiffinListings(listings);
            }).catch((error) => {
                console.error("Error getting tiffin documents: ", error);
                tiffinListingsGrid.innerHTML = '<p style="color: var(--text-secondary);">Could not load listings. Please try again.</p>';
            });
        };

        fetchAndDisplayTiffins();
        tiffinFilterControls.forEach(control => {
            control.addEventListener('change', fetchAndDisplayTiffins);
        });
    }

    // --- DYNAMICALLY LOAD & FILTER LAUNDRY LISTINGS FROM FIREBASE ---
    const laundryListingsGrid = document.getElementById('laundry-listings-grid');
    if (laundryListingsGrid) {
        const laundryFilterControls = document.querySelectorAll('.filter-sidebar input');
        const renderLaundryListings = (docs) => {
            laundryListingsGrid.innerHTML = '';
            if (docs.length === 0) {
                laundryListingsGrid.innerHTML = '<p style="color: var(--text-secondary);">No laundry services match your criteria.</p>';
                return;
            }
            docs.forEach((doc) => {
                const listing = doc.data();
                const servicesText = Array.isArray(listing.services) ? listing.services.join(', ') : (listing.services || 'N/A');

                const laundryCard = `
                    <div class="provider-card">
                        <img src="${listing.imageUrl || 'https://placehold.co/320x200/282828/F39C12?text=Laundry+Service'}" alt="${listing.name || 'Laundry'}">
                        <div class="provider-content">
                            <h3>${listing.name || 'Laundry Service'}</h3>
                            <div class="provider-tags">
                                <span class="tag laundry">${servicesText}</span>
                            </div>
                            <p class="description">${listing.location || 'Location not specified'}</p>
                            <div class="provider-footer">
                                <span class="price">Starts at ₹${listing.price || 0}</span>
                                <a href="details.html?type=laundry&id=${doc.id}" class="details-button">View Details</a>
                            </div>
                        </div>
                    </div>
                `;
                laundryListingsGrid.innerHTML += laundryCard;
            });
        };

        const fetchAndDisplayLaundry = () => {
            laundryListingsGrid.innerHTML = '<p style="color: var(--text-secondary);">Filtering laundry services...</p>';
            const priceSlider = document.getElementById('laundry-price-range');
            const maxPrice = priceSlider ? parseInt(priceSlider.value, 10) : 2000;
            const serviceTypes = Array.from(document.querySelectorAll('input[name="service"]:checked')).map(el => el.value);

            let query = db.collection("laundry_listings").where("price", "<=", maxPrice);
            query.get().then((querySnapshot) => {
                let listings = querySnapshot.docs;
                if (serviceTypes.length > 0) {
                    listings = listings.filter(doc => {
                        const listingServices = doc.data().services;
                        if (!Array.isArray(listingServices)) return false;
                        return serviceTypes.every(type => listingServices.includes(type));
                    });
                }
                renderLaundryListings(listings);
            }).catch((error) => {
                console.error("Error getting laundry documents: ", error);
                laundryListingsGrid.innerHTML = '<p style="color: var(--text-secondary);">Could not load listings. Please try again.</p>';
            });
        };

        fetchAndDisplayLaundry();
        laundryFilterControls.forEach(control => {
            control.addEventListener('change', fetchAndDisplayLaundry);
        });
    }
    
    // --- DYNAMICALLY LOAD LISTING DETAILS ON DETAILS.HTML ---
    const detailsContainer = document.getElementById('listing-details-container');
    if (detailsContainer) {
        const urlParams = new URLSearchParams(window.location.search);
        const listingId = urlParams.get('id');
        const listingType = urlParams.get('type');
        if (!listingId || !listingType) {
            detailsContainer.innerHTML = '<h1 style="text-align: center; color: var(--primary-gold);">Listing Not Found</h1><p style="text-align: center;">Please go back and select a valid listing.</p>';
            return;
        }
        const collectionMap = { 'pg': 'pg_listings', 'tiffin': 'tiffin_listings', 'laundry': 'laundry_listings' };
        const collectionName = collectionMap[listingType];
        if (!collectionName) {
            detailsContainer.innerHTML = '<h1 style="text-align: center; color: var(--primary-gold);">Invalid Listing Type</h1>';
            return;
        }
        db.collection(collectionName).doc(listingId).get().then(doc => {
            if (doc.exists) {
                const data = doc.data();
                document.title = `${data.name || 'Listing'} - Apna Aasra`;
                let detailsHtml = `
                    <div class="details-layout" style="display: grid; grid-template-columns: 2fr 1fr; gap: 40px; align-items: flex-start;">
                        <div class="details-gallery">
                            <img src="${data.imageUrl || 'https://placehold.co/800x600/282828/F39C12?text=Apna+Aasra'}" alt="${data.name}" style="width: 100%; border-radius: 15px;">
                        </div>
                        <div class="details-info" style="background: var(--background-light); padding: 30px; border-radius: 15px;">
                            <h1 style="font-size: 2.5em; color: var(--primary-gold); margin-bottom: 10px;">${data.name}</h1>
                            <p style="color: var(--text-secondary); margin-bottom: 20px;"><i class="fas fa-map-marker-alt"></i> ${data.location}</p>
                            <p style="font-size: 2em; font-weight: 700; color: var(--primary-gold); margin-bottom: 25px;">₹${data.price}<span style="font-size: 0.5em; color: var(--text-secondary);"> / month</span></p>
                            <div class="details-specifics" style="border-top: 1px solid var(--border-color); padding-top: 20px; margin-top: 20px;">
                                ${getSpecificDetails(data, listingType)}
                            </div>
                            <div class="details-description" style="margin-top: 25px;">
                                <h3 style="color: var(--text-primary); margin-bottom: 10px;">About this place</h3>
                                <p style="color: var(--text-secondary);">${data.description || 'No detailed description provided.'}</p>
                            </div>
                            <button class="cta-button" style="width: 100%; margin-top: 30px; padding: 15px;">Contact Owner</button>
                        </div>
                    </div>
                `;
                detailsContainer.innerHTML = detailsHtml;
            } else {
                detailsContainer.innerHTML = '<h1 style="text-align: center; color: var(--primary-gold);">Listing Not Found</h1><p style="text-align: center;">The listing you are looking for does not exist.</p>';
            }
        }).catch(error => {
            console.error("Error fetching document:", error);
            detailsContainer.innerHTML = '<h1>Error</h1><p>There was an error retrieving the listing details.</p>';
        });
    }

    function getSpecificDetails(data, type) {
        let content = '';
        if (type === 'pg') {
            const amenitiesText = Array.isArray(data.amenities) ? data.amenities.join(', ') : 'Basic amenities included.';
            content = `<h4 style="color: var(--text-primary); margin-bottom: 15px;">Room Details</h4><p style="color: var(--text-secondary); margin-bottom: 10px;"><strong>Type:</strong> ${data.roomType || 'N/A'}</p><p style="color: var(--text-secondary);"><strong>Amenities:</strong> ${amenitiesText}</p>`;
        } else if (type === 'tiffin') {
            content = `<h4 style="color: var(--text-primary); margin-bottom: 15px;">Cuisine Details</h4><p style="color: var(--text-secondary); margin-bottom: 10px;"><strong>Type:</strong> ${data.cuisineType || 'N/A'}</p><p style="color: var(--text-secondary);"><strong>Includes:</strong> Lunch & Dinner</p>`;
        } else if (type === 'laundry') {
            const servicesText = Array.isArray(data.services) ? data.services.join(', ') : (data.services || 'Standard wash and fold.');
            content = `<h4 style="color: var(--text-primary); margin-bottom: 15px;">Service Details</h4><p style="color: var(--text-secondary);"><strong>Services Offered:</strong> ${servicesText}</p>`;
        }
        return content;
    }

    // --- Login/Signup Modal Functionality & Firebase Auth ---
    const loginCta = document.getElementById('login-cta');
    const backdrop = document.getElementById('backdrop');
    const authModal = document.getElementById('auth-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const linkToSignup = document.getElementById('link-to-signup');
    const linkToLogin = document.getElementById('link-to-login');

    const openModal = () => {
        if (backdrop && authModal) {
            backdrop.classList.add('active');
            authModal.classList.add('active');
        }
    };
    const closeTheModal = () => {
        if (backdrop && authModal) {
            backdrop.classList.remove('active');
            authModal.classList.remove('active');
        }
    };

    if (loginCta) loginCta.addEventListener('click', openModal);
    if (backdrop) backdrop.addEventListener('click', closeTheModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeTheModal);

    if (linkToSignup && linkToLogin && loginForm && signupForm) {
        linkToSignup.addEventListener('click', (e) => {
            e.preventDefault();
            loginForm.classList.add('form--hidden');
            signupForm.classList.remove('form--hidden');
        });
        linkToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            signupForm.classList.add('form--hidden');
            loginForm.classList.remove('form--hidden');
        });
    }

    const showAuthMessage = (form, message, isError = true) => {
        let messageContainer = form.querySelector('.form-message');
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.className = 'form-message';
            form.insertBefore(messageContainer, form.children[1]);
        }
        messageContainer.style.marginBottom = '10px';
        messageContainer.style.textAlign = 'center';
        messageContainer.textContent = message;
        messageContainer.style.color = isError ? '#E74C3C' : '#2ECC71';
    };

    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const usernameInput = signupForm.querySelector('#signup-username');
            const emailInput = signupForm.querySelector('#signup-email');
            const passwordInput = signupForm.querySelector('#signup-password');

            const email = emailInput ? emailInput.value : '';
            const password = passwordInput ? passwordInput.value : '';
            const username = usernameInput ? usernameInput.value : '';

            auth.createUserWithEmailAndPassword(email, password)
                .then(userCredential => {
                    if (username && userCredential.user.updateProfile) {
                        return userCredential.user.updateProfile({ displayName: username });
                    }
                })
                .then(() => {
                    closeTheModal();
                })
                .catch(error => {
                    showAuthMessage(signupForm, error.message);
                });
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = loginForm.querySelector('#login-email');
            const passwordInput = loginForm.querySelector('#login-password');

            const email = emailInput ? emailInput.value : '';
            const password = passwordInput ? passwordInput.value : '';

            auth.signInWithEmailAndPassword(email, password)
                .then(() => {
                    closeTheModal();
                })
                .catch(error => {
                    showAuthMessage(loginForm, error.message);
                });
        });
    }

    auth.onAuthStateChanged(user => {
        const loginButton = document.getElementById('login-cta');
        if (!loginButton) return;

        const newLoginButton = loginButton.cloneNode(true);
        loginButton.parentNode.replaceChild(newLoginButton, loginButton);

        if (user) {
            newLoginButton.textContent = `Logout (${user.displayName || user.email.split('@')[0]})`;
            newLoginButton.addEventListener('click', () => {
                auth.signOut();
            });
        } else {
            newLoginButton.textContent = 'Login / Sign Up';
            newLoginButton.addEventListener('click', openModal);
        }
    });

    // --- Hero Panel Text Slider ---
    const slides = document.querySelectorAll('.slide');
    if (slides.length > 0) {
        let currentSlide = 0;
        setInterval(() => {
            if (slides[currentSlide]) slides[currentSlide].classList.remove('active');
            currentSlide = (currentSlide + 1) % slides.length;
            if (slides[currentSlide]) slides[currentSlide].classList.add('active');
        }, 4000); 
    }

    // --- Price Range Sliders ---
    const setupPriceSlider = (rangeId, valueId) => {
        const priceRange = document.getElementById(rangeId);
        const priceValue = document.getElementById(valueId);
        if (priceRange && priceValue) {
            priceValue.textContent = priceRange.value;
            priceRange.addEventListener('input', (event) => {
                priceValue.textContent = event.target.value;
            });
        }
    };
    setupPriceSlider('price-range', 'price-value');
    setupPriceSlider('tiffin-price-range', 'tiffin-price-value');
    setupPriceSlider('laundry-price-range', 'laundry-price-value');

    // --- Help Page FAQ Accordion ---
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if (!question) return;
        question.addEventListener('click', () => {
            const currentlyActive = document.querySelector('.faq-item.active');
            if (currentlyActive && currentlyActive !== item) {
                currentlyActive.classList.remove('active');
                const prevAnswer = currentlyActive.querySelector('.faq-answer');
                if (prevAnswer) prevAnswer.style.maxHeight = 0;
            }
            item.classList.toggle('active');
            const answer = item.querySelector('.faq-answer');
            if (answer) {
                if (item.classList.contains('active')) {
                    answer.style.maxHeight = answer.scrollHeight + "px";
                } else {
                    answer.style.maxHeight = 0;
                }
            }
        });
    });

    // --- Payment Page Functionality ---
    const paymentForm = document.getElementById('card-payment-form');
    if (paymentForm) {
        const urlParams = new URLSearchParams(window.location.search);
        const planName = urlParams.get('plan') || 'Premium Plan';
        const planPrice = urlParams.get('price') || '199';
        const summaryName = document.getElementById('summary-plan-name');
        const summaryPrice = document.getElementById('summary-plan-price');
        const summaryTotal = document.getElementById('summary-total-price');

        if (summaryName) summaryName.textContent = planName;
        if (summaryPrice) summaryPrice.textContent = `₹${planPrice} / month`;
        if (summaryTotal) summaryTotal.textContent = `₹${planPrice}`;

        const cardNumberInput = document.getElementById('card-number');
        if (cardNumberInput) {
            cardNumberInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                let parts = [];
                for (let i = 0; i < value.length; i += 4) {
                    parts.push(value.substring(i, i + 4));
                }
                e.target.value = parts.join(' ');
            });
        }

        paymentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const payBtn = paymentForm.querySelector('.pay-button');
            if (payBtn) {
                payBtn.disabled = true;
                payBtn.textContent = "Processing Mock Payment...";
            }
            setTimeout(() => {
                alert("Demo simulation: Payment recorded successfully in sandbox environment.");
                window.location.href = "index.html";
            }, 1200);
        });
    }

    // --- THEME TOGGLER ---
    const themeToggleButton = document.getElementById('theme-toggle');
    const body = document.body;

    const applyTheme = (theme) => {
        if (theme === 'light') {
            body.classList.add('light-mode');
        } else {
            body.classList.remove('light-mode');
        }
    };

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        applyTheme(savedTheme);
    } else {
        const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
        applyTheme(prefersLight ? 'light' : 'dark');
    }

    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', () => {
            const isLight = body.classList.contains('light-mode');
            const newTheme = isLight ? 'dark' : 'light';
            applyTheme(newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }
});
