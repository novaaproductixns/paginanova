console.log("SCRIPT CARGADO");

import {
    auth,
    provider,
    signInWithPopup,
    signOut,
    db,
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    deleteDoc,
    doc,
    serverTimestamp,
    where,
    updateDoc,
    increment,
    getDoc,
    onSnapshot
} from "./firebase.js";

const elementos = document.querySelectorAll("section");

const observer = typeof IntersectionObserver !== "undefined"
    ? new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("show");
            }
        });
    })
    : null;

elementos.forEach(sec => {
    sec.classList.add("hidden");
    if (observer) {
        observer.observe(sec);
    } else {
        sec.classList.add("show");
    }
});

const menu = document.querySelector(".menu");
const boton = document.querySelector(".menu-btn");

if (boton && menu) {
    boton.onclick = () => {
        menu.classList.toggle("active");
    };

    menu.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            menu.classList.remove("active");
        });
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 768) {
            menu.classList.remove("active");
        }
    });
}

const scrollProgressBar = document.getElementById("scroll-progress-bar");
if (scrollProgressBar) {
    window.addEventListener("scroll", () => {
        const scrollTop = window.scrollY;
        const maxScroll = Math.max(1, document.body.scrollHeight - window.innerHeight);
        const percentage = (scrollTop / maxScroll) * 100;
        scrollProgressBar.style.width = `${percentage}%`;
    }, { passive: true });
}

const loginLink = document.querySelector(".login-link");
const loginPanel = document.querySelector(".login-panel");
const googleLoginButton = document.querySelector(".google-btn");
const adminBtn = document.querySelector(".admin-btn");
const adminMenu = document.querySelector(".admin-menu");
const adminItem = document.querySelector(".admin-item");
const notificationsBtn = document.querySelector("#notifications");
const notificationsModal = document.querySelector("#notificationsModal");
const closeNotifications = document.querySelector(".close-notifications");
const notificationsList = document.querySelector("#notifications-list");
const statsBtn = document.querySelector("#stats");
const statsModal = document.querySelector("#statsModal");
const closeStatsModal = document.querySelector("#closeStatsModal");
const statVisits = document.querySelector("#stat-visits");
const statPosts = document.querySelector("#stat-posts");
const statComments = document.querySelector("#stat-comments");
const statLikes = document.querySelector("#stat-likes");
const statDetails = document.querySelector("#stat-details");
const newPostBtn = document.querySelector("#new-post");
let statsUnsubscribe = null;
const postModal = document.querySelector("#postModal");
const closePostModal = document.querySelector(".close-post-modal");
const publishPostBtn = document.querySelector("#publish-post");
const postTitleInput = document.querySelector("#post-title");
const postDescriptionInput = document.querySelector("#post-description");
const postImageInput = document.querySelector("#post-image");
const postVideoInput = document.querySelector("#post-video");
const postStatus = document.querySelector("#post-status");
const postFeedback = document.querySelector("#post-feedback");
const commentFeedback = document.querySelector("#comment-feedback");
const contactForm = document.querySelector("#contactForm");
const formStatus = document.querySelector("#formStatus");
const allowedEmails = [
    "saritaa.ariass@gmail.com",
    "sophiavenegas30@gmail.com",
    "sarahrozo99@gmail.com",
    "daniel@nova.com",
    "brayan@nova.com",
    "michaelgcastellanos@gmail.com"
];

const isNovaMember = email => {
    const normalized = email.trim().toLowerCase();
    return allowedEmails.includes(normalized)
        || normalized.endsWith("@nova.com")
        || normalized.endsWith("@nova.mx");
};

const showLoginMessage = (message, type = "error") => {
    const loginMessage = document.querySelector("#login-message");
    if (!loginMessage) return;
    loginMessage.textContent = message;
    loginMessage.classList.toggle("success", type === "success");
    loginMessage.classList.toggle("error", type !== "success");
};

if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const submitBtn = document.getElementById("submitContactBtn");
        if (submitBtn) submitBtn.textContent = "Enviando...";
        if (formStatus) {
            formStatus.textContent = "";
            formStatus.style.color = "";
        }

        const formData = new FormData(contactForm);

        try {
            const response = await fetch("https://formsubmit.co/ajax/novaproductions224@gmail.com", {
                method: "POST",
                body: formData
            });

            const responseText = await response.text();
            let result = {};

            if (responseText) {
                try {
                    result = JSON.parse(responseText);
                } catch {
                    result = { message: responseText };
                }
            }

            if (response.ok) {
                if (formStatus) {
                    formStatus.textContent = "¡Mensaje enviado con éxito!";
                    formStatus.style.color = "#7ef0b1";
                }
                contactForm.reset();
            } else {
                throw new Error(result.message || result.error || "Error al enviar");
            }
        } catch (error) {
            console.error("Error:", error);
            if (formStatus) {
                formStatus.textContent = "Hubo un error al enviar el mensaje. Inténtalo de nuevo.";
                formStatus.style.color = "#ff8b8b";
            }
        } finally {
            if (submitBtn) submitBtn.textContent = "Enviar mensaje";
        }
    });
}

const closeLoginPanel = () => {
    loginPanel?.classList.remove("active");
    showLoginMessage("", "success");
};

const openLoginPanel = () => {
    loginPanel?.classList.add("active");
};

const getCurrentUser = () => window.localStorage.getItem("novaUser");

const setCurrentUser = email => {
    window.localStorage.setItem("novaUser", email);
};

const clearCurrentUser = async () => {
    if (auth) {
        try {
            await signOut(auth);
        } catch (error) {
            console.warn("Error cerrando sesión de Firebase:", error);
        }
    }
    window.localStorage.removeItem("novaUser");
    updateAdminControls();
};

const closeAdminMenu = () => {
    if (adminMenu) {
        adminMenu.classList.remove("active");
        adminMenu.hidden = true;
    }
};

let currentEditingPostId = null;

const openPostModal = (editingPost = null) => {
    if (postModal) {
        postModal.hidden = false;
        document.body.classList.add("modal-open");
        closeAdminMenu();

        const modalTitle = postModal.querySelector("h2");
        const publishBtn = document.querySelector("#publish-post");

        if (editingPost) {
            currentEditingPostId = editingPost.id;
            if (postTitleInput) postTitleInput.value = editingPost.title || "";
            if (postDescriptionInput) postDescriptionInput.value = editingPost.description || "";
            if (modalTitle) modalTitle.textContent = "Editar publicación";
            if (publishBtn) publishBtn.textContent = "Guardar cambios";
        } else {
            currentEditingPostId = null;
            resetPostForm();
            if (modalTitle) modalTitle.textContent = "Nueva publicación";
            if (publishBtn) publishBtn.textContent = "Publicar";
        }
    }
};

const closePostModalHandler = () => {
    if (postModal) {
        postModal.hidden = true;
        document.body.classList.remove("modal-open");
        currentEditingPostId = null;
        resetPostForm();

        const modalTitle = postModal.querySelector("h2");
        const publishBtn = document.querySelector("#publish-post");
        if (modalTitle) modalTitle.textContent = "Nueva publicación";
        if (publishBtn) publishBtn.textContent = "Publicar";
    }
};

const showPostStatus = (message, type = "error") => {
    if (!postStatus) return;
    postStatus.textContent = message;
    postStatus.className = `post-status ${type}`.trim();
};

const showFeedbackMessage = (message, type = "success", target = formStatus) => {
    if (!target) return;
    target.textContent = message;
    target.style.color = type === "success" ? "#7ef0b1" : "#ff8b8b";
};

const resetPostForm = () => {
    if (postTitleInput) postTitleInput.value = "";
    if (postDescriptionInput) postDescriptionInput.value = "";
    if (postImageInput) postImageInput.value = "";
    if (postVideoInput) postVideoInput.value = "";
};

const uploadPostFile = async (file) => {
    if (!file) return null;

    const isVideo = file.type?.startsWith("video/");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "nova_upload");

    const response = isVideo
        ? await fetch("https://api.cloudinary.com/v1_1/gj88yfrb/video/upload", {
            method: "POST",
            body: formData
        })
        : await fetch("https://api.cloudinary.com/v1_1/gj88yfrb/image/upload", {
            method: "POST",
            body: formData
        });

    let data = {};
    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (!response.ok) {
        const message = data.error?.message || data.message || "Error al subir archivo";
        throw new Error(message);
    }

    return data.secure_url || data.url || null;
};

const publishPost = async () => {
    const currentEmail = getCurrentUser();

    if (!currentEmail) {
        showPostStatus("Debes iniciar sesión para publicar.");
        return;
    }

    const title = postTitleInput?.value.trim() || "";
    const description = postDescriptionInput?.value.trim() || "";

    if (!title || !description) {
        showPostStatus("Completa el título y la descripción.");
        return;
    }

    if (currentEditingPostId) {
        showPostStatus("Guardando cambios...");
        try {
            const updateData = { title, description };

            if (postImageInput?.files?.[0]) {
                updateData.imageUrl = await uploadPostFile(postImageInput.files[0]);
            }
            if (postVideoInput?.files?.[0]) {
                updateData.videoUrl = await uploadPostFile(postVideoInput.files[0]);
            }

            await updateDoc(doc(db, "posts", currentEditingPostId), updateData);
            showPostStatus("¡Publicación actualizada correctamente!", "success");
            showFeedbackMessage("¡Publicación actualizada correctamente!", "success", postFeedback);
            resetPostForm();
            closePostModalHandler();
            setTimeout(() => location.reload(), 800);
        } catch (error) {
            console.error("Error al actualizar publicación:", error);
            showPostStatus("No se pudo actualizar la publicación.");
        }
        return;
    }

    showPostStatus("Publicando...");

    try {
        const imageUrl = postImageInput?.files?.[0]
            ? await uploadPostFile(postImageInput.files[0])
            : null;

        const videoUrl = postVideoInput?.files?.[0]
            ? await uploadPostFile(postVideoInput.files[0])
            : null;

        const postData = {
            title,
            description,
            imageUrl,
            videoUrl,
            authorEmail: currentEmail,

            likes: 0,

            comments: 0,

            createdAt: serverTimestamp()
        };

        const newPostRef = await addDoc(collection(db, "posts"), postData);
        showPostStatus("¡Publicación creada correctamente!", "success");
        showFeedbackMessage("¡Publicación creada correctamente!", "success", postFeedback);
        if (slider) {
            renderPostSlide(newPostRef.id, {
                ...postData,
                createdAt: new Date()
            }, true);
        }
        resetPostForm();
        closePostModalHandler();
    } catch (error) {
        console.error("Error al publicar:", error);
        showPostStatus("No se pudo publicar. Intenta de nuevo.");
    }
};

const addNotification = async (type, message, postId = null) => {

    try {

        await addDoc(collection(db, "notifications"), {

            type,
            message,
            postId,
            createdAt: serverTimestamp(),
            read: false

        });

        if (!notificationsModal?.hidden) {
            await loadNotifications();
        }

    } catch (error) {

        console.error("Error creando notificación:", error);

    }

};

const loadNotifications = async () => {
    if (!notificationsList) return;

    try {
        const notificationsQuery = query(
            collection(db, "notifications"),
            orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(notificationsQuery);

        notificationsList.innerHTML = "";

        if (snapshot.empty) {
            notificationsList.innerHTML = `
                <p>No hay notificaciones.</p>
            `;
            return;
        }

        snapshot.forEach(doc => {
            const notification = doc.data();
            const notificationId = doc.id;
            notificationsList.innerHTML += `
                <div class="notification">
                    <div class="notification-content">
                        <strong>${notification.type.toUpperCase()}</strong>
                        <p>${notification.message}</p>
                    </div>
                    <button type="button" class="notification-delete-btn" onclick="window.deleteNotification('${notificationId}')" aria-label="Eliminar notificación">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `;
        });

    } catch (error) {
        console.error("Error cargando notificaciones:", error);
    }
};

const deleteNotification = async (notificationId) => {
    try {
        await deleteDoc(doc(db, "notifications", notificationId));
        await loadNotifications();
    } catch (error) {
        console.error("Error eliminando notificación:", error);
        alert("No se pudo eliminar la notificación.");
    }
};

window.deleteNotification = deleteNotification;

// --- SISTEMA DE ESTADÍSTICAS Y VISITAS ---
const registrarVisitaYEstadisticas = async () => {
    try {
        const hoy = new Date().toISOString().split('T')[0]; // Fecha actual YYYY-MM-DD
        const visitasRef = collection(db, "pageVisits");
        
        // Evitar contar múltiples visitas del mismo usuario en la misma sesión
        const sessionKey = `visited_${hoy}`;
        if (!window.sessionStorage.getItem(sessionKey)) {
            await addDoc(visitasRef, {
                date: hoy,
                timestamp: serverTimestamp()
            });
            window.sessionStorage.setItem(sessionKey, "true");
        }
    } catch (error) {
        console.error("Error al registrar visita:", error);
    }
};

// Ejecutar el registro de visita al cargar
registrarVisitaYEstadisticas();

const giveLike = async (postId) => {
    const email = getCurrentUser() || "Anónimo";

    try {
        const postRef = doc(db, "posts", postId);
        const postSnap = await getDoc(postRef);

        if (!postSnap.exists()) return;

        const data = postSnap.data();
        
        const currentLikes = typeof data.likes === "number" ? data.likes : 0;
        
        const likedKey = `liked_${postId}_${email}`;
        const hasLiked = window.localStorage.getItem(likedKey) === "true";

        if (hasLiked) {

            window.localStorage.removeItem(likedKey);
            await updateDoc(postRef, {
                likes: Math.max(0, currentLikes - 1)
            });
        } else {
            
            window.localStorage.setItem(likedKey, "true");
            await updateDoc(postRef, {
                likes: currentLikes + 1
            });

            await addNotification(
                "❤️ Like",
                `${email} dio like a una publicación.`,
                postId
            );
        }

    } catch (error) {
        console.error("Error updating like:", error);
    }
};

const deletePost = async (postId) => {

    try {

        await deleteDoc(doc(db, "posts", postId));

        showFeedbackMessage("¡Publicación eliminada correctamente!", "error", postFeedback);

        location.reload();

    } catch (error) {

        console.error("Error eliminando:", error);

        alert("No se pudo eliminar la publicación.");

    }

};

const archivePost = async (postId) => {
    try {
        await updateDoc(doc(db, "posts", postId), {
            archived: true
        });
        showFeedbackMessage("¡Publicación archivada!", "success", postFeedback);
        location.reload();
    } catch (error) {
        console.error("Error archivando publicación:", error);
        alert("No se pudo archivar la publicación.");
    }
};

const unarchivePost = async (postId) => {
    try {
        await updateDoc(doc(db, "posts", postId), {
            archived: false
        });
        showFeedbackMessage("¡Publicación desarchivada!", "success", postFeedback);
        await loadArchivedPosts();
        if (slider) {
            slider.innerHTML = "";
            await loadPosts();
        }
    } catch (error) {
        console.error("Error desarchivando publicación:", error);
        alert("No se pudo desarchivar la publicación.");
    }
};

const addComment = async (postId, commentText, authorName) => {
    const author = authorName || "Anónimo";
    const authorEmail = getCurrentUser() || null;
    
    try {
        const commentsRef = collection(db, "posts", postId, "comments");
        await addDoc(commentsRef, {
            text: commentText,
            authorName: author,
            authorEmail,
            createdAt: serverTimestamp()
        });

        const postRef = doc(db, "posts", postId);
        await updateDoc(postRef, {
            comments: increment(1)
        });

        const commentCounter = document.querySelector(`.comment-count-${postId}`);
        if (commentCounter) {
            commentCounter.textContent = String(Number(commentCounter.textContent || 0) + 1);
        }

        await addNotification(
            "💬 Comentario",
            `${author} comentó en una publicación.`,
            postId
        );
        
        await loadCommentsInline(postId);
        await refreshStatsModalIfOpen();
        showFeedbackMessage("¡Comentario publicado con éxito!", "success", commentFeedback);
    } catch (error) {
        console.error("Error al publicar comentario:", error);
        alert("No se pudo publicar el comentario.");
    }
};

const deleteComment = async (postId, commentId, commentAuthorEmail) => {
    const currentUser = getCurrentUser();
    const isAuthor = currentUser && currentUser === commentAuthorEmail;
    const isAdmin = currentUser && isNovaMember(currentUser);

    if (!isAdmin && !isAuthor) {
        alert("No tienes permiso para eliminar este comentario.");
        return;
    }

    try {
        await deleteDoc(doc(db, "posts", postId, "comments", commentId));

        const postRef = doc(db, "posts", postId);
        await updateDoc(postRef, {
            comments: increment(-1)
        });

        const commentCounter = document.querySelector(`.comment-count-${postId}`);
        if (commentCounter) {
            commentCounter.textContent = String(Math.max(0, Number(commentCounter.textContent || 0) - 1));
        }

        await loadCommentsInline(postId);
        await refreshStatsModalIfOpen();
        showFeedbackMessage("¡Comentario eliminado correctamente!", "error", commentFeedback);
    } catch (error) {
        console.error("Error eliminando comentario:", error);
        alert("No se pudo eliminar el comentario.");
    }
};

const toggleLike = async (postId) => {
    await giveLike(postId);
};

const renderPostSlide = (postId, post, prepend = false) => {
    if (!slider) return;

    const slide = document.createElement("div");
    slide.className = "slide";

    slide.innerHTML = `
         <div class="work-card">

${
    getCurrentUser()
    ? `
    <button class="post-menu-btn" data-id="${postId}">
        <i class="fa-solid fa-ellipsis-vertical"></i>
    </button>

    <div class="post-menu" hidden>
        <button class="edit-post-btn" data-id="${postId}">
            ✏️ Editar publicación
        </button>
        <button class="archive-post-btn" data-id="${postId}">
            📦 Archivar publicación
        </button>
        <button class="delete-post-btn" data-id="${postId}">
            🗑 Eliminar publicación
        </button>
    </div>
    `
    : ""
}

               ${
                   post.videoUrl
                   ? `<video class="video-slot" controls playsinline preload="metadata" poster="${post.imageUrl || ""}">
                         <source src="${post.videoUrl}">
                      </video>`
                   : `<img class="video-slot" src="${post.imageUrl}" alt="${post.title}">`
                }

             <h3>${post.title}</h3>

             <p>${post.description}</p>

               <div class="post-actions">

                     <button class="like-btn" data-id="${postId}">
                         ❤️ <span>${post.likes || 0}</span>
                     </button>

                     <button class="comment-btn" data-id="${postId}" style="cursor: default;">
                         💬 <span class="comment-count-${postId}">${post.comments || 0}</span>
                     </button>

               </div>

                     <div class="comments-container" id="comments-container-${postId}">
                         <div id="comments-list-${postId}" class="comments-list"></div>
                     </div>

                     <button type="button" class="comment-trigger-btn comment-trigger-row" data-id="${postId}">
                            <span>Escribe un comentario</span>
                     </button>
        `;

    if (prepend) {
        slider.prepend(slide);
    } else {
        slider.appendChild(slide);
    }

    loadCommentsInline(postId);

    const menuBtn = slide.querySelector(".post-menu-btn");
    const postMenu = slide.querySelector(".post-menu");
    const editBtn = slide.querySelector(".edit-post-btn");
    const archiveBtn = slide.querySelector(".archive-post-btn");
    const deleteBtn = slide.querySelector(".delete-post-btn");
    const likeBtn = slide.querySelector(".like-btn");
    const viewCommentsBtn = slide.querySelector(".comment-btn");
    const writeTriggerBtn = slide.querySelector(".comment-trigger-btn");
    const writeTriggerRow = slide.querySelector(".comment-trigger-row");

    const openCommentModal = () => {
        const modal = document.getElementById("commentModal");
        if (!modal) return;
        modal.hidden = false;
        modal.setAttribute("data-current-post", postId);
        loadComments(postId);
    };

    if (viewCommentsBtn) {
        viewCommentsBtn.style.cursor = "default";
    }

    if (writeTriggerBtn) {
        writeTriggerBtn.addEventListener("click", openCommentModal);
    }

    if (writeTriggerRow) {
        writeTriggerRow.addEventListener("click", openCommentModal);
    }

    if (menuBtn && postMenu) {
        menuBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            document.querySelectorAll(".post-menu").forEach(menu => {
                if (menu !== postMenu) {
                    menu.hidden = true;
                }
            });
            postMenu.hidden = !postMenu.hidden;
        });
    }

    if (editBtn) {
        editBtn.addEventListener("click", () => {
            if (postMenu) postMenu.hidden = true;
            openPostModal({
                id: postId,
                title: post.title,
                description: post.description,
                imageUrl: post.imageUrl,
                videoUrl: post.videoUrl
            });
        });
    }

    if (archiveBtn) {
        archiveBtn.addEventListener("click", () => {
            if (postMenu) postMenu.hidden = true;
            if (confirm("¿Deseas archivar esta publicación? Solo estará visible en la sección Archivo.")) {
                archivePost(postId);
            }
        });
    }

    if (deleteBtn) {
        deleteBtn.addEventListener("click", () => {
            if (confirm("¿Deseas eliminar esta publicación?")) {
                deletePost(postId);
            }
        });
    }

    if (likeBtn) {
        likeBtn.addEventListener("click", async () => {
            await giveLike(postId);

            const contador = likeBtn.querySelector("span");
            const email = getCurrentUser() || "Anónimo";
            const likedKey = `liked_${postId}_${email}`;
            const hasLiked = window.localStorage.getItem(likedKey) === "true";

            let currentVal = Number(contador.textContent);
            if (hasLiked) {
                contador.textContent = currentVal + 1;
                likeBtn.style.color = "#ff7878";
            } else {
                contador.textContent = Math.max(0, currentVal - 1);
                likeBtn.style.color = "";
            }
        });
    }
};

const loadPosts = async () => {

    try {

        const postsQuery = query(
            collection(db, "posts"),
            orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(postsQuery);

        snapshot.forEach(docSnap => {
            const post = docSnap.data();
            const postId = docSnap.id;
            if (post.archived) return;
            renderPostSlide(postId, post);
        });

    } catch (error) {

        console.error("Error cargando publicaciones:", error);

    }

};

const updateAdminControls = () => {
    const currentUser = getCurrentUser();
    const isLoggedIn = Boolean(currentUser);

    if (adminBtn) {
        adminBtn.hidden = !isLoggedIn;
    }

    if (adminItem) {
        adminItem.hidden = !isLoggedIn;
    }

    if (loginLink) {
        loginLink.textContent = isLoggedIn ? "Cerrar sesión" : "Iniciar sesión";
        loginLink.setAttribute("aria-label", isLoggedIn ? "Cerrar sesión" : "Iniciar sesión");
    }

    closeAdminMenu();
};

const signInWithGoogleAccount = async () => {
    console.log("Intentando iniciar sesión...");
    try {
        const result = await signInWithPopup(auth, provider);
        const email = result.user?.email || "";

        if (!isNovaMember(email)) {
            await signOut(auth);
            showLoginMessage("Acceso restringido a integrantes de Nova.");
            return;
        }

        setCurrentUser(email);
        updateAdminControls();
        showLoginMessage("Inicio de sesión exitoso. ¡Bienvenido a Nova!", "success");
        setTimeout(closeLoginPanel, 800);
    } catch (error) {
        console.error(error);
        showLoginMessage("No se pudo iniciar sesión. Intenta de nuevo.");
    }
};

if (loginLink && loginPanel && googleLoginButton) {
    loginLink.addEventListener("click", event => {
        event.preventDefault();
        if (getCurrentUser()) {
            clearCurrentUser();
        } else {
            openLoginPanel();
        }
    });

    googleLoginButton.addEventListener("click", event => {
        event.preventDefault();
        signInWithGoogleAccount();
    });

    adminBtn?.addEventListener("click", event => {
        event.stopPropagation();
        const isVisible = !adminMenu?.classList.contains("active");
        if (adminMenu) {
            adminMenu.classList.toggle("active", isVisible);
            adminMenu.hidden = !isVisible;
        }
    });

    newPostBtn?.addEventListener("click", () => {
        openPostModal();
    });

    notificationsBtn?.addEventListener("click", async () => {

        notificationsModal.hidden = false;

        closeAdminMenu();

        await loadNotifications();

    });

    closeNotifications?.addEventListener("click", () => {

        notificationsModal.hidden = true;

    });

    statsBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        closeAdminMenu();
        abrirModalEstadisticas();
    });

    closeStatsModal?.addEventListener("click", () => {
        if (statsModal) statsModal.hidden = true;
        if (typeof statsUnsubscribe === "function") {
            statsUnsubscribe();
            statsUnsubscribe = null;
        }
    });

    closePostModal?.addEventListener("click", closePostModalHandler);

    publishPostBtn?.addEventListener("click", () => {
        publishPost();
    });

    const archiveMenuItem = document.querySelector("#archive");
    const archiveModal = document.querySelector("#archiveModal");
    const closeArchiveModal = document.querySelector("#closeArchiveModal");

    archiveMenuItem?.addEventListener("click", async () => {
        closeAdminMenu();
        if (archiveModal) archiveModal.hidden = false;
        await loadArchivedPosts();
    });

    closeArchiveModal?.addEventListener("click", () => {
        if (archiveModal) archiveModal.hidden = true;
    });

    document.addEventListener("click", event => {
        const clickedInsidePanel = event.target.closest(".login-panel");
        const clickedLoginLink = event.target.closest(".login-link");
        const clickedAdmin = event.target.closest(".admin-item");

        if (!clickedInsidePanel && !clickedLoginLink) {
            closeLoginPanel();
        }

        if (!clickedAdmin) {
            closeAdminMenu();
        }

        if (event.target === postModal) {
            closePostModalHandler();
        }

        if (event.target === notificationsModal) {

            notificationsModal.hidden = true;

        }

        if (event.target === archiveModal) {
            archiveModal.hidden = true;
        }

    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {

            closeLoginPanel();

            closeAdminMenu();

            closePostModalHandler();

            notificationsModal.hidden = true;

            if (archiveModal) archiveModal.hidden = true;

        }
    });

    updateAdminControls();
}

const loadArchivedPosts = async () => {
    const archiveList = document.querySelector("#archive-list");
    if (!archiveList) return;

    archiveList.innerHTML = "<p style='color: #888;'>Cargando archivo...</p>";

    try {
        const postsQuery = query(
            collection(db, "posts"),
            orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(postsQuery);
        
        let archivedCount = 0;
        archiveList.innerHTML = "";

        snapshot.forEach(docSnap => {
            const post = docSnap.data();
            const postId = docSnap.id;

            if (post.archived) {
                archivedCount++;
                const item = document.createElement("div");
                item.className = "notification";
                item.style.display = "flex";
                item.style.flexDirection = "column";
                item.style.gap = "10px";
                item.style.alignItems = "stretch";

                item.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                        <strong style="font-size: 1.05rem; color: #fff;">${post.title}</strong>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <button type="button" class="btn-unarchive" data-id="${postId}" style="background: linear-gradient(135deg, #7c3aed, #4f46e5); color: #fff; border: none; padding: 6px 14px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.85rem; transition: opacity 0.2s;">
                                📥 Desarchivar
                            </button>
                            <button type="button" class="notification-delete-btn btn-delete-archived" data-id="${postId}" title="Eliminar publicación" style="width: 34px; height: 34px;">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    ${post.description ? `<p style="margin: 0; color: rgba(247,245,255,0.8); font-size: 0.9rem;">${post.description}</p>` : ""}
                `;

                archiveList.appendChild(item);

                const unarchiveBtn = item.querySelector(".btn-unarchive");
                unarchiveBtn?.addEventListener("click", () => {
                    if (confirm("¿Deseas desarchivar esta publicación para que vuelva a mostrarse en el carrusel principal?")) {
                        unarchivePost(postId);
                    }
                });

                const deleteBtn = item.querySelector(".btn-delete-archived");
                deleteBtn?.addEventListener("click", () => {
                    if (confirm("¿Deseas eliminar esta publicación archivada?")) {
                        deletePost(postId);
                    }
                });
            }
        });

        if (archivedCount === 0) {
            archiveList.innerHTML = "<p style='color: #888; text-align: center; padding: 15px;'>No hay publicaciones archivadas.</p>";
        }
    } catch (error) {
        console.error("Error al cargar publicaciones archivadas:", error);
        archiveList.innerHTML = "<p style='color: #ff8b8b;'>Error al cargar las publicaciones archivadas.</p>";
    }
};

const abrirModalEstadisticas = async (openModal = true) => {
    const statsModal = document.querySelector("#statsModal");
    const statVisits = document.querySelector("#stat-visits");
    const statPosts = document.querySelector("#stat-posts");
    const statComments = document.querySelector("#stat-comments");
    const statLikes = document.querySelector("#stat-likes");
    const statDetails = document.querySelector("#stat-details");

    if (!statsModal) return;

    if (openModal) {
        statsModal.hidden = false;
    }
    if (statVisits) statVisits.textContent = "...";
    if (statPosts) statPosts.textContent = "...";
    if (statComments) statComments.textContent = "...";
    if (statLikes) statLikes.textContent = "...";
    if (statDetails) statDetails.textContent = "Cargando métricas en vivo...";

    if (typeof statsUnsubscribe === "function") {
        statsUnsubscribe();
        statsUnsubscribe = null;
    }

    try {
        const postsQuery = query(collection(db, "posts"), orderBy("createdAt", "desc"));
        const visitsQuery = query(collection(db, "pageVisits"));

        const updateStats = async (postsSnapshot, visitsSnapshot) => {
            const treintaDiasAtras = new Date();
            treintaDiasAtras.setDate(treintaDiasAtras.getDate() - 30);

            let totalVisits30Days = 0;
            visitsSnapshot.forEach(docSnap => {
                const data = docSnap.data();
                if (data.timestamp) {
                    const visitDate = data.timestamp.toDate();
                    if (visitDate >= treintaDiasAtras) {
                        totalVisits30Days++;
                    }
                } else {
                    totalVisits30Days++;
                }
            });

            const totalPosts = postsSnapshot.size;
            let totalComments = 0;
            let totalLikes = 0;
            let activePosts = 0;

            postsSnapshot.forEach(docSnap => {
                const p = docSnap.data();
                const likesValue = typeof p.likes === "number" ? p.likes : Array.isArray(p.likes) ? p.likes.length : Number(p.likes) || 0;
                const commentsValue = typeof p.comments === "number" ? p.comments : Number(p.comments) || 0;
                totalLikes += likesValue;
                totalComments += commentsValue;
                if (likesValue > 0 || commentsValue > 0) {
                    activePosts++;
                }
            });

            const averageDailyVisits = totalVisits30Days > 0 ? Math.round(totalVisits30Days / 30) : 0;
            const averageCommentsPerPost = totalPosts > 0 ? Math.round((totalComments / totalPosts) * 10) / 10 : 0;
            const averageLikesPerPost = totalPosts > 0 ? Math.round((totalLikes / totalPosts) * 10) / 10 : 0;

            if (statVisits) statVisits.textContent = String(totalVisits30Days);
            if (statPosts) statPosts.textContent = String(totalPosts);
            if (statComments) statComments.textContent = String(totalComments);
            if (statLikes) statLikes.textContent = String(totalLikes);

            if (statDetails) {
                statDetails.textContent = `Últimos 30 días: ${totalVisits30Days} visitas totales (${averageDailyVisits}/día). ${totalPosts} publicaciones, ${totalComments} comentarios, ${totalLikes} likes. Promedio: ${averageCommentsPerPost} comentarios/post, ${averageLikesPerPost} likes/post, ${activePosts} publicaciones activas.`;
            }
        };

        let lastPostsSnapshot = null;
        let lastVisitsSnapshot = null;

        const unsubscribePosts = onSnapshot(postsQuery, postsSnapshot => {
            lastPostsSnapshot = postsSnapshot;
            if (lastVisitsSnapshot) {
                updateStats(lastPostsSnapshot, lastVisitsSnapshot);
            }
        }, error => {
            console.error("Error en snapshot de posts:", error);
            if (statDetails) statDetails.textContent = "Error en tiempo real del feed de publicaciones.";
        });

        const unsubscribeVisits = onSnapshot(visitsQuery, visitsSnapshot => {
            lastVisitsSnapshot = visitsSnapshot;
            if (lastPostsSnapshot) {
                updateStats(lastPostsSnapshot, lastVisitsSnapshot);
            }
        }, error => {
            console.error("Error en snapshot de visitas:", error);
            if (statDetails) statDetails.textContent = "Error en tiempo real de visitas.";
        });

        statsUnsubscribe = () => {
            unsubscribePosts();
            unsubscribeVisits();
        };
    } catch (error) {
        console.error("Error configurando estadísticas en vivo:", error);
        if (statDetails) {
            statDetails.textContent = "No se pudieron cargar las métricas en vivo.";
        }
    }
};

const refreshStatsModalIfOpen = async () => {
    const statsModalEl = document.querySelector("#statsModal");
    if (!statsModalEl || statsModalEl.hidden) return;
    await abrirModalEstadisticas(false);
};

const slider = document.querySelector(".slider");
const prevBtn = document.querySelector(".carousel-btn.prev");
const nextBtn = document.querySelector(".carousel-btn.next");

if (slider) {
    let index = 0;

    loadPosts();

    const updateSlider = () => {
        const slides = slider.querySelectorAll(".slide");
        if (slides.length === 0) return;

        if (index >= slides.length) {
            index = 0;
        }

        slider.style.transform = `translateX(-${index * 100}%)`;
    };

    prevBtn?.addEventListener("click", () => {
        const total = slider.querySelectorAll(".slide").length;
        if (total === 0) return;

        index = (index - 1 + total) % total;
        updateSlider();
    });

    nextBtn?.addEventListener("click", () => {
        const total = slider.querySelectorAll(".slide").length;
        if (total === 0) return;

        index = (index + 1) % total;
        updateSlider();
    });
}

// Evento para guardar el comentario
const saveCommentBtn = document.getElementById("saveCommentBtn");
if (saveCommentBtn) {
    saveCommentBtn.addEventListener("click", async () => {
        const modal = document.getElementById("commentModal");
        const postId = modal?.getAttribute("data-current-post");
        const text = document.getElementById("commentText")?.value.trim();
        const authorName = document.getElementById("commentAuthor")?.value.trim() || "Anónimo";

        if (postId && text) {
            await addComment(postId, text, authorName);
            modal.hidden = true;
            document.getElementById("commentText").value = "";
            const authorInput = document.getElementById("commentAuthor");
            if (authorInput) authorInput.value = "";
        } else {
            alert("Por favor, escribe un comentario.");
        }
    });
}

const loadComments = async (postId) => {
    const commentsList = document.getElementById("comments-list");
    if (!commentsList) return;

    commentsList.innerHTML = "<p>Cargando comentarios...</p>";

    try {
        const commentsQuery = query(
            collection(db, "posts", postId, "comments"),
            orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(commentsQuery);

        commentsList.innerHTML = "";

        if (snapshot.empty) {
            commentsList.innerHTML = "<p>No hay comentarios aún. ¡Sé el primero en comentar!</p>";
            return;
        }

        snapshot.forEach(docSnap => {
            const comment = docSnap.data();
            const commentId = docSnap.id;
            const currentEmail = getCurrentUser();
            
            // Verifica si el usuario actual puede borrarlo (es admin/autor)
            const canDelete = currentEmail === comment.authorEmail || (currentEmail && isNovaMember(currentEmail));

            commentsList.innerHTML += `
                <div class="notification" style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${comment.authorName || "Anónimo"}</strong>
                        <p>${comment.text}</p>
                    </div>
                    ${
                        canDelete 
                        ? `<button type="button" onclick="window.eliminarComentario('${postId}', '${commentId}', '${comment.authorEmail}')" style="background:none; border:none; color:#ff8b8b; cursor:pointer;">🗑</button>`
                        : ""
                    }
                </div>
            `;
        });
    } catch (error) {
        console.error("Error al cargar comentarios:", error);
        commentsList.innerHTML = "<p>Hubo un error al cargar los comentarios.</p>";
    }
};

// Escucha global para abrir el modal en posts dinámicos
document.addEventListener("click", (e) => {
    const commentTrigger = e.target.closest(".comment-trigger-btn, .comment-trigger-row");
    if (commentTrigger) {
        const postId = commentTrigger.getAttribute("data-id");
        const modal = document.getElementById("commentModal");
        if (modal && postId) {
            modal.hidden = false;
            modal.setAttribute("data-current-post", postId);
        }
    }
});

// Exponer la función de eliminar al objeto global para que funcione el botón inline
window.eliminarComentario = async (postId, commentId, author) => {
    await deleteComment(postId, commentId, author);
    loadComments(postId); // Recarga los comentarios del modal actual
};

// Función para mostrar/ocultar los comentarios de un post
const toggleComments = async (postId) => {
    const container = document.getElementById(`comments-container-${postId}`);
    const isVisible = container.style.display !== "none";

    if (isVisible) {
        container.style.display = "none";
    } else {
        container.style.display = "block";
        // Cargar comentarios al abrir el área
        await loadCommentsInline(postId);
    }
};

// Función para renderizar comentarios dentro de su propio recuadro en cada post
const loadCommentsInline = async (postId) => {
    const listDiv = document.getElementById(`comments-list-${postId}`);
    if (!listDiv) return;

    const commentCounter = document.querySelector(`.comment-count-${postId}`);
    listDiv.innerHTML = "<p style='color: #888; font-size: 0.9rem;'>Cargando...</p>";

    try {
        const commentsQuery = query(
            collection(db, "posts", postId, "comments"),
            orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(commentsQuery);
        
        if (commentCounter) {
            commentCounter.textContent = String(snapshot.size);
        }

        listDiv.innerHTML = "";

        if (snapshot.empty) {
            listDiv.innerHTML = "<p style='color: #888; font-size: 0.9rem;'>No hay comentarios aún. ¡Sé el primero!</p>";
            return;
        }

        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const commentId = docSnap.id;
            const currentEmail = getCurrentUser();
            const canDelete = currentEmail === data.authorEmail || (currentEmail && isNovaMember(currentEmail));

            listDiv.innerHTML += `
                <div class="comment-item">
                    <div class="comment-body">
                        <span class="comment-author">${data.authorName || "Anónimo"}</span>
                        <p class="comment-text">${data.text}</p>
                    </div>
                    ${
                        canDelete 
                        ? `<button type="button" class="comment-delete-btn" onclick="window.eliminarComentarioInline('${postId}', '${commentId}', '${data.authorEmail}')" aria-label="Eliminar comentario"><i class="fa-solid fa-trash"></i></button>`
                        : ""
                    }
                </div>
            `;
        });
    } catch (error) {
        console.error("Error al cargar comentarios inline:", error);
        listDiv.innerHTML = "<p style='color: #ff8b8b; font-size: 0.9rem;'>Error al cargar.</p>";
    }
};

window.eliminarComentarioInline = async (postId, commentId) => {
    try {
        await deleteDoc(doc(db, "posts", postId, "comments", commentId));
        await updateDoc(doc(db, "posts", postId), {
            comments: increment(-1)
        });
        await loadCommentsInline(postId);
        await refreshStatsModalIfOpen();
    } catch (error) {
        console.error("Error al eliminar comentario:", error);
    }
};

/* ==========================================
   KOSMO - VUELO CONTROLADO POR SCROLL CON TOOLTIP DE SECCIÓN
   ========================================== */

function initKosmoFlight() {
    const video = document.getElementById("kosmo-video");
    const canvas = document.getElementById("kosmo-canvas");
    const tooltip = document.getElementById("kosmo-tooltip");
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    let videoReady = false;

    // Secciones y mensajes explicativos
    const seccionesInfo = [
        { id: "inicio", titulo: "🚀 Inicio", mensaje: "¡Bienvenido a Nova Productions!" },
        { id: "servicios", titulo: "⚡ Servicios", mensaje: "Fotografía, producción y diseño" },
        { id: "algunostrabajos", titulo: "🎬 Portafolio", mensaje: "Mira algunos de nuestros trabajos" },
        { id: "equipo", titulo: "👥 Nuestro Equipo", mensaje: "Conoce al equipo Nova" },
        { id: "departamentos", titulo: "🏢 Departamentos", mensaje: "Áreas y especialidades" },
        { id: "arcade-carousel-section", titulo: "🎮 Arcade Station", mensaje: "¡Disfruta de la estación de minijuegos!" },
        { id: "contacto", titulo: "✉ Contacto", mensaje: "¡Hablemos de tu próximo proyecto!" }
    ];

    let seccionActualIndex = -1;

    function actualizarSeccionMensaje() {
        if (!tooltip) return;

        const scrollPos = window.scrollY + window.innerHeight * 0.4;
        let indexEncontrado = -1;

        seccionesInfo.forEach((sec, idx) => {
            const el = document.getElementById(sec.id);
            if (!el) return;
            const top = el.offsetTop;
            const bottom = top + el.offsetHeight;
            if (scrollPos >= top && scrollPos <= bottom) {
                indexEncontrado = idx;
            }
        });

        if (indexEncontrado !== -1) {
            if (indexEncontrado !== seccionActualIndex) {
                seccionActualIndex = indexEncontrado;
                const info = seccionesInfo[indexEncontrado];
                tooltip.innerHTML = `<strong>${info.titulo}</strong>${info.mensaje}`;
            }
            tooltip.classList.add("visible");
        } else {
            seccionActualIndex = -1;
            tooltip.classList.remove("visible");
        }
    }

    video.muted = true;
    video.play().then(() => {
        videoReady = true;
    }).catch(() => {
        console.log("Autoplay bloqueado por el navegador.");
    });

    video.addEventListener("canplaythrough", () => {
        videoReady = true;
    });

    if (video.readyState >= video.HAVE_CURRENT_DATA) {
        videoReady = true;
    }

    // Ajustar resolución del canvas según el tamaño del video
    function resizeCanvas() {
        canvas.width = video.videoWidth || 300;
        canvas.height = video.videoHeight || 300;
    }
    video.addEventListener("loadedmetadata", resizeCanvas);
    resizeCanvas();

    // Variables de posición y física de vuelo
    let currentX = window.innerWidth * 0.1;
    let currentY = 100;
    let targetX = currentX;
    let targetY = currentY;

    // Obtener todas las cajas y textos de la página que Kosmo DEBE EVITAR estrictamente
    function getBlockedAreas() {
        const selectors = ".hero-content, .about-text, .about-kosmo, .card, .member, .department-card, .work-card, .slide, #arcade-carousel-wrapper, #contactForm, form, header, footer, .title, .social, h1, h2, h3, p, button, input, textarea, img, .login-panel-content, .post-modal-content, .notifications-content";
        const elements = document.querySelectorAll(selectors);
        const boxes = [];

        elements.forEach(el => {
            if (el.offsetParent === null || el.hidden) return;
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;

            // Margen de seguridad amplio de 35px alrededor de cualquier texto o caja
            const padding = 35;
            boxes.push({
                left: rect.left - padding,
                top: rect.top + window.scrollY - padding,
                right: rect.right + padding,
                bottom: rect.bottom + window.scrollY + padding
            });
        });
        return boxes;
    }

    // Verificar si un punto colisiona con alguna caja de contenido
    function isColliding(x, y, width, height, boxes) {
        for (let i = 0; i < boxes.length; i++) {
            const box = boxes[i];
            if (
                x < box.right &&
                x + width > box.left &&
                y < box.bottom &&
                y + height > box.top
            ) {
                return true; // Hay colisión con texto, botón o caja
            }
        }
        return false; // Espacio 100% libre
    }

    // Calcular la posición buscando estrictamente espacios vacíos
    function updateKosmoPosition() {
        const scrollY = window.scrollY;
        const maxScroll = Math.max(1, document.body.scrollHeight - window.innerHeight);
        const scrollProgress = scrollY / maxScroll;

        const boxes = getBlockedAreas();
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        const kosmoWidth = canvas.offsetWidth || 220;
        const kosmoHeight = canvas.offsetHeight || 220;

        // Trayectoria base de vuelo influenciada por el scroll
        let baseTargetX = (Math.sin(scrollProgress * Math.PI * 4) * 0.4 + 0.5) * (screenWidth - kosmoWidth - 80) + 40;
        let baseTargetY = scrollY + (scrollProgress * (screenHeight - 160)) + 70;

        let finalX = baseTargetX;
        let finalY = baseTargetY;

        // Si la posición ideal colisiona con algún texto o caja, buscar exhaustivamente un espacio 100% libre
        if (isColliding(finalX, finalY, kosmoWidth, kosmoHeight, boxes)) {
            const candidates = [];
            const xOptions = [
                screenWidth - kosmoWidth - 35, // Margen derecho exterior
                35,                             // Margen izquierdo exterior
                screenWidth * 0.85 - kosmoWidth,
                screenWidth * 0.15,
                screenWidth * 0.70 - kosmoWidth,
                screenWidth * 0.30
            ];
            const yOffsets = [0, -40, 40, -80, 80];

            for (let yOff of yOffsets) {
                const testY = baseTargetY + yOff;
                for (let testX of xOptions) {
                    candidates.push({ x: testX, y: testY });
                }
            }

            let foundFree = false;
            for (let cand of candidates) {
                if (!isColliding(cand.x, cand.y, kosmoWidth, kosmoHeight, boxes)) {
                    finalX = cand.x;
                    finalY = cand.y;
                    foundFree = true;
                    break;
                }
            }

            // Si todos los puntos internos colisionan, forzar al margen lateral exterior libre
            if (!foundFree) {
                finalX = (scrollProgress * 10 % 2 > 1) ? 30 : (screenWidth - kosmoWidth - 30);
            }
        }

        targetX = finalX;
        targetY = finalY;

        actualizarSeccionMensaje();
    }

    // Procesar el video en el canvas eliminando la pantalla verde
    function renderChromaKey() {
        if ((videoReady || video.readyState >= video.HAVE_CURRENT_DATA) && !video.paused && !video.ended) {
            const dpr = window.devicePixelRatio || 1;
            const w = (video.videoWidth || 300) * dpr;
            const h = (video.videoHeight || 300) * dpr;

            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w;
                canvas.height = h;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const d = frame.data;
            const l = d.length;

            for (let i = 0; i < l; i += 4) {
                const r = d[i];
                const g = d[i + 1];
                const b = d[i + 2];

                if (g > 55 && g > r * 1.12 && g > b * 1.12) {
                    const maxRB = Math.max(r, b);
                    const diff = g - maxRB;
                    if (diff > 35) {
                        d[i + 3] = 0;
                    } else {
                        d[i + 3] = Math.floor(255 * (1 - diff / 35));
                    }
                }
            }
            ctx.putImageData(frame, 0, 0);
        }
    }

    // Animación suave (Lerp) para que el personaje "vuele" de forma fluida
    function animate() {
        updateKosmoPosition();

        currentX += (targetX - currentX) * 0.08;
        currentY += (targetY - currentY) * 0.08;

        const renderY = currentY - window.scrollY;
        canvas.style.transform = `translate3d(${currentX}px, ${renderY}px, 0)`;

        // Ocultar Kosmo volador si el Kosmo estático (saludando) está en pantalla
        const staticKosmo = document.querySelector(".about-kosmo");
        let hideKosmo = false;
        if (staticKosmo) {
            const rect = staticKosmo.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                hideKosmo = true;
            }
        }

        canvas.style.opacity = hideKosmo ? "0" : "1";
        canvas.style.transition = "opacity 0.3s ease";

        // Ocultar el texto inmediatamente si Kosmo sale de la pantalla visible o está oculto
        const isKosmoOnScreen = (
            !hideKosmo &&
            renderY >= -100 &&
            renderY <= window.innerHeight + 100 &&
            currentX >= -100 &&
            currentX <= window.innerWidth + 100
        );

        if (tooltip) {
            if (!isKosmoOnScreen || seccionActualIndex === -1) {
                tooltip.classList.remove("visible");
            } else {
                tooltip.classList.add("visible");
                const kosmoW = canvas.offsetWidth || 220;
                const tooltipW = tooltip.offsetWidth || 180;
                const tooltipH = tooltip.offsetHeight || 40;

                let tooltipX = currentX + (kosmoW / 2) - (tooltipW / 2);
                let tooltipY = renderY - tooltipH - 12;

                if (renderY < 80) {
                    tooltipY = renderY + (canvas.offsetHeight || 220) + 12;
                }

                const boundedX = Math.max(15, Math.min(window.innerWidth - tooltipW - 15, tooltipX));
                tooltip.style.left = `${boundedX}px`;
                tooltip.style.top = `${tooltipY}px`;
            }
        }

        renderChromaKey();
        requestAnimationFrame(animate);
    }

    window.addEventListener("scroll", updateKosmoPosition);
    window.addEventListener("resize", updateKosmoPosition);

    updateKosmoPosition();
    animate();
}

/* ==========================================
   KOSMO SALUDANDO (SECCIÓN SOBRE NOSOTROS - CHROMA KEY)
   ========================================== */

function initKosmoSaludando() {
    const video = document.getElementById("kosmo-saludando-video");
    const canvas = document.getElementById("kosmo-saludando-canvas");
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    let videoReady = false;

    video.muted = true;
    video.play().then(() => {
        videoReady = true;
    }).catch(() => {
        console.log("Autoplay de kosmo saludando bloqueado por el navegador.");
    });

    video.addEventListener("canplaythrough", () => {
        videoReady = true;
    });

    if (video.readyState >= video.HAVE_CURRENT_DATA) {
        videoReady = true;
    }

    function renderChromaKeySaludando() {
        if ((videoReady || video.readyState >= video.HAVE_CURRENT_DATA) && !video.paused && !video.ended && ctx) {
            const dpr = window.devicePixelRatio || 1;
            const w = (video.videoWidth || 320) * dpr;
            const h = (video.videoHeight || 320) * dpr;

            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w;
                canvas.height = h;
            }

            ctx.clearRect(0, 0, w, h);
            ctx.drawImage(video, 0, 0, w, h);

            const frame = ctx.getImageData(0, 0, w, h);
            const d = frame.data;
            const l = d.length;

            for (let i = 0; i < l; i += 4) {
                const r = d[i];
                const g = d[i + 1];
                const b = d[i + 2];

                // Eliminar fondo de pantalla verde
                if (g > 55 && g > r * 1.12 && g > b * 1.12) {
                    const maxRB = Math.max(r, b);
                    const diff = g - maxRB;
                    if (diff > 35) {
                        d[i + 3] = 0;
                    } else {
                        d[i + 3] = Math.floor(255 * (1 - diff / 35));
                    }
                }
            }
            ctx.putImageData(frame, 0, 0);
        }
        requestAnimationFrame(renderChromaKeySaludando);
    }

    renderChromaKeySaludando();
}

/* ==========================================
   PANTALLA DE INTRO / PRELOADER (KOSMO APERTURA)
   ========================================== */

function initIntroLoader() {
    const loader = document.getElementById("intro-loader");
    const video = document.getElementById("intro-video");

    if (!loader || !video) return;

    document.body.style.overflow = "hidden";
    let hasFaded = false;

    function fadeOutLoader() {
        if (hasFaded) return;
        hasFaded = true;

        loader.classList.add("fade-out");
        document.body.style.overflow = "";

        setTimeout(() => {
            if (loader.parentNode) {
                loader.remove();
            }
        }, 850);
    }

    video.muted = true;
    
    // Intentar reproducir el video de apertura
    const playPromise = video.play();
    if (playPromise !== undefined) {
        playPromise.catch(err => {
            console.log("Autoplay del video de apertura diferido:", err);
            setTimeout(fadeOutLoader, 1200);
        });
    }

    // Al finalizar la animación del video de apertura, revelar inmediatamente la página web
    video.addEventListener("ended", fadeOutLoader);

    // Monitorear el progreso en vivo para detectar el final de reproducción al instante
    video.addEventListener("timeupdate", () => {
        if (video.duration && video.currentTime >= video.duration - 0.25) {
            fadeOutLoader();
        }
    });

    // Permitir clic o toque para saltar la animación de intro si el usuario lo desea
    loader.addEventListener("click", fadeOutLoader);

    // Tiempo límite máximo de seguridad (6 segundos) por si hay demora de red
    setTimeout(() => {
        fadeOutLoader();
    }, 6000);
}

/* ==========================================
   NOVA ARCADE STATION (4 JUEGOS DELUXE EN CARRUSEL)
   ========================================== */

function initArcadeCarousel() {
    const track = document.getElementById("game-slider-track");
    const indicator = document.getElementById("carousel-indicator");
    const prevBtn = document.getElementById("arcade-prev-btn");
    const nextBtn = document.getElementById("arcade-next-btn");
    if (!track || !indicator) return;

    let currentSlide = 0;
    const totalSlides = 3;
    const gameNames = ["KOSMO ESCAPE", "KOSMO MAZE", "KOSMO ORBIT"];

    function updateCarousel() {
        const slideWidth = document.querySelector(".game-slide")?.offsetWidth || 520;
        track.style.transform = `translateX(-${currentSlide * slideWidth}px)`;
        indicator.textContent = `${currentSlide + 1} / ${totalSlides}: ${gameNames[currentSlide]}`;
    }

    window.addEventListener("resize", updateCarousel, { passive: true });

    prevBtn?.addEventListener("click", () => {
        if (currentSlide > 0) {
            currentSlide--;
            updateCarousel();
            stopAllGames();
        }
    });

    nextBtn?.addEventListener("click", () => {
        if (currentSlide < totalSlides - 1) {
            currentSlide++;
            updateCarousel();
            stopAllGames();
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
        if (escapeRunning || mazeRunning || orbitRunning) return;
        if (e.key === "ArrowRight") {
            if (currentSlide < totalSlides - 1) {
                currentSlide++;
                updateCarousel();
                stopAllGames();
            }
        } else if (e.key === "ArrowLeft") {
            if (currentSlide > 0) {
                currentSlide--;
                updateCarousel();
                stopAllGames();
            }
        }
    });

    function stopAllGames() {
        escapeRunning = false;
        mazeRunning = false;
        orbitRunning = false;
        clearGameListeners();
        document.querySelectorAll(".overlay-game").forEach(el => el.style.display = "flex");
    }

    document.querySelectorAll(".btn-start-game").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const gameId = parseInt(e.target.getAttribute("data-game"));
            document.getElementById(`overlay-${gameId}`).style.display = "none";
            if (gameId === 0) startEscape();
            if (gameId === 2) startMaze();
            if (gameId === 3) startOrbit();
        });
    });

    // ==========================================
    // MOBILE GAMEPAD LOGIC
    // ==========================================
    const mobileGamepad = document.getElementById("mobile-gamepad");
    if (mobileGamepad) {
        const btnMap = {
            "btn-up": "ArrowUp",
            "btn-down": "ArrowDown",
            "btn-left": "ArrowLeft",
            "btn-right": "ArrowRight",
            "btn-action": " "
        };
        
        function dispatchKey(keyName, isDown) {
            const eventType = isDown ? "keydown" : "keyup";
            const event = new KeyboardEvent(eventType, {
                key: keyName,
                code: keyName === " " ? "Space" : keyName,
                bubbles: true,
                cancelable: true
            });
            window.dispatchEvent(event);
        }

        Object.keys(btnMap).forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                const press = (e) => { e.preventDefault(); dispatchKey(btnMap[id], true); };
                const release = (e) => { e.preventDefault(); dispatchKey(btnMap[id], false); };
                
                btn.addEventListener("touchstart", press, { passive: false });
                btn.addEventListener("touchend", release, { passive: false });
                btn.addEventListener("touchcancel", release, { passive: false });
                
                // For desktop testing
                btn.addEventListener("mousedown", press);
                btn.addEventListener("mouseup", release);
                btn.addEventListener("mouseleave", release);
            }
        });
    }

    // ==========================================
    // CHROMA KEY VIDEO PARA JUGADOR KOSMO (JUEGOS)
    // ==========================================
    const kosmoGameVideo = document.createElement("video");
    kosmoGameVideo.src = "animaciones/kosmovolandojuego.mp4";
    kosmoGameVideo.muted = true;
    kosmoGameVideo.loop = true;
    kosmoGameVideo.autoplay = true;
    kosmoGameVideo.playsInline = true;
    kosmoGameVideo.style.display = "none";
    document.body.appendChild(kosmoGameVideo);

    const chromaGameCanvas = document.createElement("canvas");
    chromaGameCanvas.width = 100;
    chromaGameCanvas.height = 100;
    const chromaGameCtx = chromaGameCanvas.getContext("2d", { willReadFrequently: true });

    function drawChromaKosmo(ctx, targetX, targetY, targetWidth, targetHeight) {
        if (kosmoGameVideo.readyState >= 2) {
            const dpr = window.devicePixelRatio || 1;
            const w = (kosmoGameVideo.videoWidth || 300) * dpr;
            const h = (kosmoGameVideo.videoHeight || 300) * dpr;
            if (chromaGameCanvas.width !== w || chromaGameCanvas.height !== h) {
                chromaGameCanvas.width = w;
                chromaGameCanvas.height = h;
            }
            chromaGameCtx.clearRect(0, 0, chromaGameCanvas.width, chromaGameCanvas.height);
            chromaGameCtx.drawImage(kosmoGameVideo, 0, 0, chromaGameCanvas.width, chromaGameCanvas.height);
            let frame = chromaGameCtx.getImageData(0, 0, chromaGameCanvas.width, chromaGameCanvas.height);
            let l = frame.data.length / 4;
            for (let i = 0; i < l; i++) {
                let r = frame.data[i * 4 + 0];
                let g = frame.data[i * 4 + 1];
                let b = frame.data[i * 4 + 2];
                // Remover verde
                if (g > 100 && r < g - 30 && b < g - 30) {
                    frame.data[i * 4 + 3] = 0;
                }
            }
            chromaGameCtx.putImageData(frame, 0, 0);
            ctx.drawImage(chromaGameCanvas, targetX, targetY, targetWidth, targetHeight);
        } else {
            ctx.fillStyle = "#7c3aed";
            ctx.fillRect(targetX, targetY, targetWidth, targetHeight);
            kosmoGameVideo.play().catch(()=>{});
        }
    }

    let activeGameListeners = [];
    function addGameListener(target, type, handler, options = false) {
        target.addEventListener(type, handler, options);
        activeGameListeners.push({ target, type, handler, options });
    }
    function clearGameListeners() {
        activeGameListeners.forEach(l => {
            l.target.removeEventListener(l.type, l.handler, l.options);
        });
        activeGameListeners = [];
    }

    // ==========================================
    // JUEGO 1: KOSMO ESCAPE DELUXE
    // ==========================================
    let escapeRunning = false;
    function startEscape() {
        const canvas = document.getElementById("canvas-escape");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        escapeRunning = true;

        let player = { x: 220, y: 500, width: 150, height: 150, speed: 8, hasShield: false };
        let obstacles = [];
        let stars = [];
        let shields = [];
        let particles = [];
        let score = 0;
        let frameCount = 0;
        let highScore = localStorage.getItem("nova_highscore_escape") || 0;
        let keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false };
        let level = 1;
        let levelMessageTimer = 60; // Show "NIVEL 1" at start

        const handleDown = (e) => {
            if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "a", "A", "d", "D", "w", "W", "s", "S"].includes(e.key) && escapeRunning) e.preventDefault();
            if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.ArrowLeft = true;
            if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.ArrowRight = true;
            if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") keys.ArrowUp = true;
            if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") keys.ArrowDown = true;
        };
        const handleUp = (e) => {
            if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.ArrowLeft = false;
            if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.ArrowRight = false;
            if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") keys.ArrowUp = false;
            if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") keys.ArrowDown = false;
        };

        clearGameListeners();

        addGameListener(window, "keydown", handleDown);
        addGameListener(window, "keyup", handleUp);

        addGameListener(canvas, "touchmove", (e) => {
            if (!escapeRunning) return;
            const rect = canvas.getBoundingClientRect();
            const touchX = e.touches[0].clientX - rect.left;
            const touchY = e.touches[0].clientY - rect.top;
            player.x = (touchX / rect.width) * canvas.width - player.width / 2;
            player.y = (touchY / rect.height) * canvas.height - player.height / 2;
        }, { passive: true });

        function createSparkles(x, y, color, count = 15) {
            for (let i = 0; i < count; i++) {
                particles.push({
                    x, y,
                    dx: (Math.random() - 0.5) * 8,
                    dy: (Math.random() - 0.5) * 8,
                    radius: Math.random() * 4 + 1.5,
                    color: color,
                    alpha: 1
                });
            }
        }

        function loop() {
            if (!escapeRunning) return;
            frameCount++;
            score += 1;

            if (levelMessageTimer > 0) levelMessageTimer--;

            // Level Progression
            if (level === 1 && score >= 1500) { level = 2; levelMessageTimer = 100; player.speed += 1; }
            if (level === 2 && score >= 3500) { level = 3; levelMessageTimer = 100; player.speed += 1; }
            if (level === 3 && score >= 6000) {
                escapeRunning = false;
                createSparkles(player.x + player.width / 2, player.y + player.height / 2, "#4ade80", 40);
                clearGameListeners();
                if (score > highScore) {
                    highScore = score;
                    localStorage.setItem("nova_highscore_escape", highScore);
                }
                const ov = document.getElementById("overlay-0");
                if (ov) {
                    ov.style.display = "flex";
                    const h3 = ov.querySelector("h3");
                    const p = ov.querySelector("p");
                    if (h3) h3.textContent = "¡MISIÓN CUMPLIDA! (VICTORIA)";
                    if (p) p.textContent = `Puntuación: ${score} | Récord: ${highScore}`;
                }
                return;
            }

            if (keys.ArrowLeft) player.x -= player.speed;
            if (keys.ArrowRight) player.x += player.speed;
            if (keys.ArrowUp) player.y -= player.speed;
            if (keys.ArrowDown) player.y += player.speed;

            if (player.x < 10) player.x = 10;
            if (player.x + player.width > canvas.width - 10) player.x = canvas.width - player.width - 10;
            if (player.y < 10) player.y = 10;
            if (player.y + player.height > canvas.height - 10) player.y = canvas.height - player.height - 10;

            // Generar asteroides con rotación y frecuencia basada en nivel
            let spawnRate = level === 1 ? 30 : (level === 2 ? 22 : 15);
            if (frameCount % spawnRate === 0) {
                let size = Math.random() * 32 + 22;
                obstacles.push({
                    x: Math.random() * (canvas.width - size - 20) + 10,
                    y: -size,
                    width: size,
                    height: size,
                    speed: Math.random() * 3.5 + 4 + level + (score / 300),
                    rot: Math.random() * Math.PI,
                    rotSpeed: (Math.random() - 0.5) * 0.1
                });
            }

            // Generar estrellas coleccionables (+250 pts)
            if (frameCount % 120 === 0) {
                stars.push({ x: Math.random() * (canvas.width - 30) + 15, y: -25, size: 22, speed: 3.5 });
            }

            // Generar Escudo de Protección
            if (frameCount % 350 === 0 && !player.hasShield) {
                shields.push({ x: Math.random() * (canvas.width - 30) + 15, y: -25, size: 24, speed: 3 });
            }

            // Actualizar Estrellas
            for (let i = stars.length - 1; i >= 0; i--) {
                const s = stars[i];
                s.y += s.speed;
                if (player.x < s.x + s.size && player.x + player.width > s.x && player.y < s.y + s.size && player.y + player.height > s.y) {
                    score += 250;
                    createSparkles(s.x + s.size / 2, s.y + s.size / 2, "#facc15", 16);
                    stars.splice(i, 1);
                    continue;
                }
                if (s.y > canvas.height) stars.splice(i, 1);
            }

            // Actualizar Escudos
            for (let i = shields.length - 1; i >= 0; i--) {
                const sh = shields[i];
                sh.y += sh.speed;
                if (player.x < sh.x + sh.size && player.x + player.width > sh.x && player.y < sh.y + sh.size && player.y + player.height > sh.y) {
                    player.hasShield = true;
                    createSparkles(sh.x + sh.size / 2, sh.y + sh.size / 2, "#38bdf8", 20);
                    shields.splice(i, 1);
                    continue;
                }
                if (sh.y > canvas.height) shields.splice(i, 1);
            }

            // Actualizar Asteroides y colisiones
            for (let idx = obstacles.length - 1; idx >= 0; idx--) {
                const obs = obstacles[idx];
                obs.y += obs.speed;
                obs.rot += obs.rotSpeed;

                const paddingX = 45;
                const paddingY = 40;
                if (
                    player.x + paddingX < obs.x + obs.width &&
                    player.x + player.width - paddingX > obs.x &&
                    player.y + paddingY < obs.y + obs.height &&
                    player.y + player.height - paddingY > obs.y
                ) {
                    if (player.hasShield) {
                        player.hasShield = false;
                        createSparkles(player.x + player.width / 2, player.y + player.height / 2, "#38bdf8", 25);
                        obstacles.splice(idx, 1);
                        continue;
                    } else {
                        escapeRunning = false;
                        createSparkles(player.x + player.width / 2, player.y + player.height / 2, "#ef4444", 30);
                        clearGameListeners();

                        if (score > highScore) {
                            highScore = score;
                            localStorage.setItem("nova_highscore_escape", highScore);
                        }

                        const ov = document.getElementById("overlay-0");
                        if (ov) {
                            ov.style.display = "flex";
                            const h3 = ov.querySelector("h3");
                            const p = ov.querySelector("p");
                            if (h3) h3.textContent = "¡IMPACTO! GAME OVER";
                            if (p) p.textContent = `Puntuación: ${score} | Récord: ${highScore}`;
                        }
                        return;
                    }
                }
                if (obs.y > canvas.height) obstacles.splice(idx, 1);
            }

            // Actualizar partículas
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.x += p.dx;
                p.y += p.dy;
                p.alpha -= 0.03;
                if (p.alpha <= 0) particles.splice(i, 1);
            }

            // RENDERIZADO GRÁFICO
            ctx.fillStyle = "#0c0817";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Estrellas dinámicas de fondo
            ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
            for (let i = 0; i < 45; i++) {
                let px = (i * 47) % canvas.width;
                let py = (i * 61 + frameCount * 1.5) % canvas.height;
                ctx.fillRect(px, py, 2, 2);
            }

            // Dibujar Estrellas Bonus (★)
            stars.forEach(s => {
                ctx.fillStyle = "#facc15";
                ctx.shadowBlur = 10;
                ctx.shadowColor = "#facc15";
                ctx.font = "20px sans-serif";
                ctx.fillText("★", s.x, s.y + s.size);
                ctx.shadowBlur = 0;
            });

            // Dibujar Escudo Item (🛡️)
            shields.forEach(sh => {
                ctx.fillStyle = "#38bdf8";
                ctx.shadowBlur = 12;
                ctx.shadowColor = "#38bdf8";
                ctx.font = "20px sans-serif";
                ctx.fillText("🛡️", sh.x, sh.y + sh.size);
                ctx.shadowBlur = 0;
            });

            // Dibujar Jugador (Kosmo)
            ctx.save();
            ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
            if (player.hasShield) {
                ctx.strokeStyle = "#38bdf8";
                ctx.lineWidth = 3;
                ctx.shadowBlur = 15;
                ctx.shadowColor = "#38bdf8";
                ctx.beginPath();
                ctx.arc(0, 0, player.width / 2 + 6, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();
            drawChromaKosmo(ctx, player.x, player.y, player.width, player.height);

            // Dibujar Asteroides con rotación
            obstacles.forEach(obs => {
                ctx.save();
                ctx.translate(obs.x + obs.width / 2, obs.y + obs.height / 2);
                ctx.rotate(obs.rot);
                ctx.fillStyle = "#dc2626";
                ctx.shadowBlur = 8;
                ctx.shadowColor = "#ef4444";
                ctx.beginPath();
                ctx.arc(0, 0, obs.width / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#991b1b";
                ctx.beginPath();
                ctx.arc(-obs.width * 0.2, -obs.height * 0.2, obs.width * 0.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });

            // Dibujar Partículas
            particles.forEach(p => {
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.alpha;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            });

            // UI de Puntuación y Récord
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 16px sans-serif";
            ctx.fillText(`PUNTOS: ${score}`, 20, 32);
            ctx.fillText(`NIVEL: ${level}`, 20, 52);
            ctx.fillText(`RÉCORD: ${highScore}`, canvas.width - 150, 32);

            if (levelMessageTimer > 0) {
                ctx.fillStyle = `rgba(167, 139, 250, ${levelMessageTimer / 50})`;
                ctx.font = "bold 40px sans-serif";
                ctx.textAlign = "center";
                ctx.fillText(`NIVEL ${level}`, canvas.width / 2, canvas.height / 2);
                ctx.textAlign = "left";
            }

            if (escapeRunning) requestAnimationFrame(loop);
        }
        loop();
    }

    // ==========================================
    // JUEGO 3: KOSMO MAZE DELUXE
    // ==========================================
    let mazeRunning = false;
    function startMaze() {
        const canvas = document.getElementById("canvas-maze");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        mazeRunning = true;

        let player = { x: 30, y: 30, size: 30, speed: 3.5 };
        let goal = { x: 450, y: 520, width: 40, height: 40 };
        let crystals = [
            { x: 100, y: 80, collected: false },
            { x: 200, y: 160, collected: false },
            { x: 320, y: 240, collected: false },
            { x: 120, y: 350, collected: false },
            { x: 380, y: 450, collected: false }
        ];
        let score = 0;
        let frameCount = 0;
        let highScore = localStorage.getItem("nova_highscore_maze") || 0;
        let keys = {};
        let level = 1;
        let levelMessageTimer = 60;

        const handleDown = (e) => {
            if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "a", "A", "d", "D", "w", "W", "s", "S"].includes(e.key) && mazeRunning) {
                e.preventDefault();
            }
            keys[e.key] = true;
        };
        const handleUp = (e) => keys[e.key] = false;

        clearGameListeners();
        addGameListener(window, "keydown", handleDown);
        addGameListener(window, "keyup", handleUp);

        addGameListener(canvas, "touchstart", (e) => {
            if (!mazeRunning) return;
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const touchX = (e.touches[0].clientX - rect.left) * (canvas.width / rect.width);
            const touchY = (e.touches[0].clientY - rect.top) * (canvas.height / rect.height);
            const dx = touchX - (player.x + player.size / 2);
            const dy = touchY - (player.y + player.size / 2);

            if (Math.abs(dx) > Math.abs(dy)) {
                keys["ArrowLeft"] = dx < 0;
                keys["ArrowRight"] = dx > 0;
                keys["ArrowUp"] = false;
                keys["ArrowDown"] = false;
            } else {
                keys["ArrowUp"] = dy < 0;
                keys["ArrowDown"] = dy > 0;
                keys["ArrowLeft"] = false;
                keys["ArrowRight"] = false;
            }
        }, { passive: false });

        const walls = [
            { x: 0, y: 0, w: 520, h: 20 },
            { x: 0, y: 0, w: 20, h: 600 },
            { x: 500, y: 0, w: 20, h: 600 },
            { x: 0, y: 580, w: 520, h: 20 },
            { x: 70, y: 20, w: 20, h: 400 },
            { x: 150, y: 120, w: 250, h: 20 },
            { x: 150, y: 200, w: 20, h: 300 },
            { x: 250, y: 300, w: 200, h: 20 },
            { x: 400, y: 120, w: 20, h: 220 }
        ];

        // Drones Centinela Patrulleros
        let patrol1 = { x: 180, y: 160, minX: 180, maxX: 370, dx: 2, size: 16 };
        let patrol2 = { x: 280, y: 340, minX: 280, maxX: 430, dx: 2.5, size: 16 };

        function checkCollision(nx, ny) {
            for (let w of walls) {
                if (nx < w.x + w.w && nx + player.size > w.x && ny < w.y + w.h && ny + player.size > w.y) {
                    return true;
                }
            }
            return false;
        }

        function loop() {
            if (!mazeRunning) return;
            frameCount++;

            let nx = player.x;
            let ny = player.y;

            if (keys["ArrowLeft"] || keys["a"] || keys["A"]) nx -= player.speed;
            if (keys["ArrowRight"] || keys["d"] || keys["D"]) nx += player.speed;
            if (keys["ArrowUp"] || keys["w"] || keys["W"]) ny -= player.speed;
            if (keys["ArrowDown"] || keys["s"] || keys["S"]) ny += player.speed;

            if (!checkCollision(nx, player.y)) player.x = nx;
            if (!checkCollision(player.x, ny)) player.y = ny;

            // Mover patrullas
            patrol1.x += patrol1.dx;
            if (patrol1.x > patrol1.maxX || patrol1.x < patrol1.minX) patrol1.dx = -patrol1.dx;

            patrol2.x += patrol2.dx;
            if (patrol2.x > patrol2.maxX || patrol2.x < patrol2.minX) patrol2.dx = -patrol2.dx;

            // Recoger Cristales (+200 pts)
            crystals.forEach(c => {
                if (!c.collected && player.x < c.x + 18 && player.x + player.size > c.x && player.y < c.y + 18 && player.y + player.size > c.y) {
                    c.collected = true;
                    score += 200;
                }
            });

            // Colisión con Patrulladores (Game Over)
            [patrol1, patrol2].forEach(p => {
                if (player.x < p.x + p.size && player.x + player.size > p.x && player.y < p.y + p.size && player.y + player.size > p.y) {
                    mazeRunning = false;
                    clearGameListeners();

                    const ov = document.getElementById("overlay-2");
                    if (ov) {
                        ov.style.display = "flex";
                        const h3 = ov.querySelector("h3");
                        const pEl = ov.querySelector("p");
                        if (h3) h3.textContent = "¡Capturado por Centinela!";
                        if (pEl) pEl.textContent = `Puntuación: ${score} | Récord: ${highScore}`;
                    }
                    return;
                }
            });

            // Meta Alcanzada (Victoria)
            if (player.x < goal.x + goal.width && player.x + player.size > goal.x && player.y < goal.y + goal.height && player.y + player.size > goal.y) {
                if (level < 3) {
                    level++;
                    score += 500;
                    levelMessageTimer = 100;
                    player.x = 30; player.y = 30; // reset position
                    crystals.forEach(c => c.collected = false); // respawn crystals
                    patrol1.dx = (patrol1.dx > 0 ? patrol1.dx + 1.5 : patrol1.dx - 1.5);
                    patrol2.dx = (patrol2.dx > 0 ? patrol2.dx + 2.0 : patrol2.dx - 2.0);
                    requestAnimationFrame(loop);
                    return;
                }

                mazeRunning = false;
                score += 1000; // Bonus final
                clearGameListeners();

                if (score > highScore) {
                    highScore = score;
                    localStorage.setItem("nova_highscore_maze", highScore);
                }

                const ov = document.getElementById("overlay-2");
                if (ov) {
                    ov.style.display = "flex";
                    const h3 = ov.querySelector("h3");
                    const pEl = ov.querySelector("p");
                    if (h3) h3.textContent = "¡LABERINTO COMPLETADO!";
                    if (pEl) pEl.textContent = `Puntuación Final: ${score} | Récord: ${highScore}`;
                }
                return;
            }

            // Dibujar
            ctx.fillStyle = "#0c0817";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Dibujar paredes Neón
            ctx.fillStyle = "#3d2c61";
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#7c3aed";
            walls.forEach(w => ctx.fillRect(w.x, w.y, w.w, w.h));
            ctx.shadowBlur = 0;

            // Cristales
            crystals.forEach(c => {
                if (!c.collected) {
                    ctx.fillStyle = "#38bdf8";
                    ctx.shadowBlur = 8;
                    ctx.shadowColor = "#38bdf8";
                    ctx.fillRect(c.x, c.y, 14, 14);
                    ctx.shadowBlur = 0;
                }
            });

            // Patrullas (Drones rojos)
            [patrol1, patrol2].forEach(p => {
                ctx.fillStyle = "#ef4444";
                ctx.shadowBlur = 10;
                ctx.shadowColor = "#ef4444";
                ctx.beginPath();
                ctx.arc(p.x + p.size / 2, p.y + p.size / 2, p.size / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            });

            // Portal Meta Verde (Vórtice animado)
            ctx.fillStyle = "#10b981";
            ctx.shadowBlur = 15;
            ctx.shadowColor = "#10b981";
            ctx.beginPath();
            ctx.arc(goal.x + goal.width / 2, goal.y + goal.height / 2, goal.width / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Jugador Kosmo
            drawChromaKosmo(ctx, player.x - 15, player.y - 15, player.size + 30, player.size + 30);

            ctx.fillStyle = "#fff";
            ctx.font = "bold 16px sans-serif";
            ctx.fillText(`PUNTOS: ${score}`, 25, 32);
            ctx.fillText(`NIVEL: ${level}`, 25, 52);
            ctx.fillText(`RÉCORD: ${highScore}`, canvas.width - 150, 32);

            if (levelMessageTimer > 0) {
                ctx.fillStyle = `rgba(167, 139, 250, ${levelMessageTimer / 50})`;
                ctx.font = "bold 40px sans-serif";
                ctx.textAlign = "center";
                ctx.fillText(`NIVEL ${level}`, canvas.width / 2, canvas.height / 2);
                ctx.textAlign = "left";
                levelMessageTimer--;
            }

            requestAnimationFrame(loop);
        }
        loop();
    }

    // ==========================================
    // JUEGO 4: KOSMO ORBIT DELUXE
    // ==========================================
    let orbitRunning = false;
    function startOrbit() {
        const canvas = document.getElementById("canvas-orbit");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        orbitRunning = true;

        let angle = 0;
        const orbitRadii = [80, 135, 190];
        let currentOrbitIndex = 0;
        let radius = orbitRadii[0];
        let targetRadius = orbitRadii[0];

        let gems = [
            { orbit: 0, angle: 1.2, collected: false },
            { orbit: 1, angle: 2.8, collected: false },
            { orbit: 2, angle: 4.5, collected: false }
        ];

        let comets = [
            { orbit: 1, angle: 0, speed: 0.03 },
            { orbit: 2, angle: 3.14, speed: 0.025 }
        ];

        let score = 0;
        let combo = 1;
        let frameCount = 0;
        let highScore = localStorage.getItem("nova_highscore_orbit") || 0;
        let level = 1;
        let levelMessageTimer = 60;

        const handleOrbitJump = () => {
            if (orbitRunning) {
                currentOrbitIndex = (currentOrbitIndex + 1) % orbitRadii.length;
                targetRadius = orbitRadii[currentOrbitIndex];
                score += 20 * combo;
            }
        };

        const handleDown = (e) => {
            if (e.code === "Space" && orbitRunning) {
                e.preventDefault();
                handleOrbitJump();
            }
        };

        clearGameListeners();
        addGameListener(window, "keydown", handleDown);
        addGameListener(canvas, "touchstart", (e) => {
            e.preventDefault();
            handleOrbitJump();
        }, { passive: false });

        function loop() {
            if (!orbitRunning) return;
            frameCount++;

            if (levelMessageTimer > 0) levelMessageTimer--;

            // Level Progression
            if (level === 1 && score >= 1200) { level = 2; levelMessageTimer = 100; comets.forEach(c => c.speed += 0.015); comets.push({ orbit: 0, angle: 1.5, speed: 0.035 }); }
            if (level === 2 && score >= 2800) { level = 3; levelMessageTimer = 100; comets.forEach(c => c.speed += 0.015); }
            if (level === 3 && score >= 5000) {
                orbitRunning = false;
                clearGameListeners();
                if (score > highScore) {
                    highScore = score;
                    localStorage.setItem("nova_highscore_orbit", highScore);
                }
                const ov = document.getElementById("overlay-3");
                if (ov) {
                    ov.style.display = "flex";
                    const h3 = ov.querySelector("h3");
                    const p = ov.querySelector("p");
                    if (h3) h3.textContent = "¡MAESTRÍA ORBITAL! (VICTORIA)";
                    if (p) p.textContent = `Puntuación Final: ${score} | Récord: ${highScore}`;
                }
                return;
            }

            angle += 0.045;
            radius += (targetRadius - radius) * 0.15;

            let centerX = canvas.width / 2;
            let centerY = canvas.height / 2;

            let kosmoX = centerX + Math.cos(angle) * radius;
            let kosmoY = centerY + Math.sin(angle) * radius;

            // Actualizar Cometas enemigas en órbitas
            comets.forEach(c => {
                c.angle -= c.speed;
                let cRad = orbitRadii[c.orbit];
                let cx = centerX + Math.cos(c.angle) * cRad;
                let cy = centerY + Math.sin(c.angle) * cRad;

                const dist = Math.hypot(kosmoX - cx, kosmoY - cy);
                if (dist < 22) {
                    orbitRunning = false;
                    clearGameListeners();

                    if (score > highScore) {
                        highScore = score;
                        localStorage.setItem("nova_highscore_orbit", highScore);
                    }

                    const ov = document.getElementById("overlay-3");
                    if (ov) {
                        ov.style.display = "flex";
                        const h3 = ov.querySelector("h3");
                        const p = ov.querySelector("p");
                        if (h3) h3.textContent = "¡Colisión Orbital!";
                        if (p) p.textContent = `Puntuación: ${score} | Récord: ${highScore}`;
                    }
                    return;
                }
            });

            // Recoger Gemas
            gems.forEach(g => {
                let gRad = orbitRadii[g.orbit];
                let gx = centerX + Math.cos(g.angle) * gRad;
                let gy = centerY + Math.sin(g.angle) * gRad;
                const dist = Math.hypot(kosmoX - gx, kosmoY - gy);

                if (!g.collected && dist < 25) {
                    g.collected = true;
                    score += 150 * combo;
                    combo++;
                    setTimeout(() => {
                        g.angle = Math.random() * Math.PI * 2;
                        g.collected = false;
                    }, 2500);
                }
            });

            // Dibujar
            ctx.fillStyle = "#0c0817";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Planeta central pulsante
            ctx.fillStyle = "#7c3aed";
            ctx.shadowBlur = 20;
            ctx.shadowColor = "#7c3aed";
            ctx.beginPath();
            ctx.arc(centerX, centerY, 45, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Órbitas de referencia Neón
            orbitRadii.forEach((rVal, i) => {
                ctx.strokeStyle = i === currentOrbitIndex ? "rgba(167, 139, 250, 0.6)" : "rgba(255, 255, 255, 0.12)";
                ctx.lineWidth = i === currentOrbitIndex ? 3 : 1.5;
                ctx.beginPath();
                ctx.arc(centerX, centerY, rVal, 0, Math.PI * 2);
                ctx.stroke();
            });

            // Gemas Orbitales
            gems.forEach(g => {
                if (!g.collected) {
                    let gRad = orbitRadii[g.orbit];
                    let gx = centerX + Math.cos(g.angle) * gRad;
                    let gy = centerY + Math.sin(g.angle) * gRad;

                    ctx.fillStyle = "#facc15";
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = "#facc15";
                    ctx.beginPath();
                    ctx.arc(gx, gy, 8, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            });

            // Cometas enemigas
            comets.forEach(c => {
                let cRad = orbitRadii[c.orbit];
                let cx = centerX + Math.cos(c.angle) * cRad;
                let cy = centerY + Math.sin(c.angle) * cRad;

                ctx.fillStyle = "#ef4444";
                ctx.shadowBlur = 12;
                ctx.shadowColor = "#ef4444";
                ctx.beginPath();
                ctx.arc(cx, cy, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            });

            // Jugador Kosmo
            drawChromaKosmo(ctx, kosmoX - 45, kosmoY - 45, 90, 90);

            ctx.fillStyle = "#fff";
            ctx.font = "bold 16px sans-serif";
            ctx.fillText(`PUNTOS: ${score}`, 25, 32);
            ctx.fillText(`COMBO: x${combo}`, 25, 55);
            ctx.fillText(`NIVEL: ${level}`, 25, 78);
            ctx.fillText(`RÉCORD: ${highScore}`, canvas.width - 150, 32);

            if (levelMessageTimer > 0) {
                ctx.fillStyle = `rgba(167, 139, 250, ${levelMessageTimer / 50})`;
                ctx.font = "bold 40px sans-serif";
                ctx.textAlign = "center";
                ctx.fillText(`NIVEL ${level}`, canvas.width / 2, canvas.height / 2);
                ctx.textAlign = "left";
            }

            if (orbitRunning) requestAnimationFrame(loop);
        }
        loop();
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        initIntroLoader();
        initKosmoFlight();
        initKosmoSaludando();
        initArcadeCarousel();
    });
} else {
    initIntroLoader();
    initKosmoFlight();
    initKosmoSaludando();
    initArcadeCarousel();
}