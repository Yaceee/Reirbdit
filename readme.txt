Projet programmation web

------------------------
Fonctionnalités implémentées :
    - Page d'accueil sécurisé, accès possible uniquement connecté
    - Inscription avec login/mdp/email avec vérification de la validité et de la bonne taille
    - connexion email/mdp
    - Ajout de lien depuis la page d'accueil, modification depuis la page du lien
    - Page de visualisation pour chaque lien par le bouton + 
    - upvote et downvote de chaque lien
    - Commenter chaque lien
    - page de profil accessible par le logo sur la barre de navigation, affichage des liens publié 
    - déploiment avec install.js et creation auto des compte max et bob, email max@test.com / bob@test.com, ainsi que de leurs lien/commentaires

------------------------
Architecture :
    - Vues
        Stocké dans le dossier views :
        - index.pug : page de connexion
        - register.pug : page d'inscription
        - home.pug : page d'accueil
        - profile.pug : page profile
        - article.pug : page d'affichage du lien
        - edit_article.pug : page d'edition du lien
        - edit_comment.pug : page d'edition du commentaire
    - style.css : feuille de style
    - img : dossier des images
    - Javascript
        - install.js : fichier d'initiallisation de la base de donnée
        - index.js : fichier serveur
