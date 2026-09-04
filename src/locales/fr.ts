import type { MessageCatalog } from './zh-CN'

export const fr = {
  app: {
    name: 'Prelude',
    description:
      'Un nouvel onglet apaisé pour favoris, onglets ouverts et À lire plus tard. Les données des favoris et onglets restent locales.',
  },
  common: {
    cancel: 'Annuler',
    save: 'Enregistrer',
    delete: 'Supprimer',
    unnamedFolder: 'Dossier sans nom',
    bookmarkCount_one: '{{count}} favori',
    bookmarkCount_other: '{{count}} favoris',
    childFolderCount_one: '{{count}} sous-dossier',
    childFolderCount_other: '{{count}} sous-dossiers',
    tabCount_one: '{{count}} onglet',
    tabCount_other: '{{count}} onglets',
    listSeparator: ' et ',
  },
  navigation: {
    quickFolders: 'Aujourd’hui',
    currentTabs: 'Onglets actuels',
    recent: 'Ajoutés récemment',
    allBookmarks: 'Tous les favoris',
    bookmarks: 'Favoris',
    folders: 'Dossiers',
    bookmarkNavigation: 'Navigation des favoris',
    currentLocation: 'Emplacement actuel',
    openFolderNavigation: 'Ouvrir la navigation des dossiers',
    closeFolderNavigation: 'Fermer la navigation des dossiers',
    collapseSidebar: 'Réduire la barre latérale',
    expandSidebar: 'Développer la barre latérale',
  },
  sync: {
    allBookmarksStatus: 'État de synchronisation des favoris : {{status}}',
    unknown: {
      label: 'État inconnu',
      title:
        'Cette version de Chrome ne fournit pas l’état de synchronisation de chaque favori',
    },
    synced: {
      label: 'Tous synchronisés',
      title: 'Tous les favoris sont synchronisés avec votre compte Chrome',
    },
    partial: {
      label: 'Partiellement synchronisés',
      title:
        'Certains favoris sont synchronisés avec Chrome et d’autres sont enregistrés localement',
    },
    local: {
      label: 'En local uniquement',
      title:
        'Tous les favoris sont enregistrés localement et ne sont pas synchronisés avec Chrome',
    },
  },
  theme: {
    groupLabel: 'Thème d’affichage',
    system: 'Utiliser le réglage du système',
    light: 'Clair',
    dark: 'Sombre',
  },
  language: {
    label: 'Langue',
    groupLabel: 'Langue de l’interface',
    zhCN: 'Chinois simplifié',
    en: 'Anglais',
    ja: 'Japonais',
    es: 'Espagnol',
    fr: 'Français',
    ru: 'Russe',
  },
  settings: {
    open: 'Ouvrir les paramètres',
    close: 'Fermer les paramètres',
    title: 'Paramètres',
    description:
      'Réglez la langue et les raccourcis, puis découvrez comment Prelude traite vos données.',
    shortcuts: {
      title: 'Raccourcis clavier',
      summary:
        'Personnalisez les actions de la page ; Chrome gère les commandes de l’extension.',
      reset: 'Rétablir les valeurs',
      change: 'Modifier',
      recording: 'Saisissez un nouveau raccourci',
      cancelHint: 'Échap pour annuler',
      unassigned: 'Non défini',
      search: {
        title: 'Rechercher favoris et onglets',
        description: 'Ouvrez rapidement la recherche depuis toute vue Prelude.',
      },
      capture: {
        title: 'Collecter la page actuelle',
        description:
          'Ajoutez l’onglet actuel à À lire plus tard depuis toute page Chrome.',
        action: 'Modifier dans Chrome',
        extensionRequired: 'Disponible dans l’extension',
      },
      errors: {
        modifier: 'Ajoutez Ctrl, Command ou Alt au raccourci.',
        reserved:
          'Le navigateur réserve cette combinaison. Choisissez-en une autre.',
        conflict:
          'Ce raccourci entre en conflit avec Collecter la page actuelle.',
      },
    },
    privacy: {
      title: 'Données et confidentialité',
      summary:
        'Prelude traite uniquement les données du navigateur nécessaires aux favoris, onglets et éléments À lire plus tard.',
      bookmarks:
        'Lit et modifie les favoris et dossiers Chrome que vous gérez.',
      tabs: 'Lit les titres et URL des onglets ouverts pour les afficher, rechercher et collecter.',
      local:
        'Les données des favoris et onglets restent locales, sans vente ni usage publicitaire.',
      search:
        'Seules les recherches Web que vous envoyez sont confiées au moteur par défaut de Chrome.',
      action: 'Lire la politique de confidentialité',
    },
    about: {
      summary: 'Consultez la présentation, la version et les liens du projet.',
      action: 'Ouvrir À propos',
    },
  },
  about: {
    title: 'À propos de Prelude',
    introduction:
      'Un nouvel onglet calme pour organiser les favoris Chrome, les onglets ouverts et À lire plus tard.',
    privacyTitle: 'Votre espace de navigation',
    privacyStatement:
      'Il n’utilise ni compte, ni publicité, ni outil d’analyse. Les données de favoris et d’onglets restent dans votre navigateur, sous votre contrôle.',
    links: {
      label: 'Liens du projet',
      github: 'GitHub',
      support: 'Assistance et commentaires',
      privacy: 'Politique de confidentialité',
    },
    version: 'Prelude {{version}}',
  },
  capture: {
    open: 'Collecter',
    close: 'Fermer le panneau de collecte',
    eyebrow: 'Options de collecte',
    title: 'Collecter dans À lire plus tard',
    description:
      'Rassemblez d’abord les pages éparses, puis triez-les et archivez-les pendant votre revue quotidienne.',
    currentPage: {
      title: 'Onglet actuel',
      empty: 'Aucune page ne peut être collectée dans cette fenêtre',
      action: 'Ajouter à À lire plus tard',
    },
    currentWindow: {
      title: 'Fenêtre actuelle',
      description_one: 'Enregistrer {{count}} page de cette fenêtre',
      description_other: 'Enregistrer {{count}} pages de cette fenêtre',
      action: 'Enregistrer la fenêtre',
    },
    currentGroup: {
      title: 'Groupe d’onglets actuel',
      description_one: '{{count}} page dans « {{title}} »',
      description_other: '{{count}} pages dans « {{title}} »',
      empty:
        'La dernière page consultée ne fait pas partie d’un groupe d’onglets',
      action: 'Enregistrer le groupe d’onglets',
    },
    duplicates: {
      title_one: '{{count}} URL en double détectée',
      title_other: '{{count}} URL en double détectées',
      description:
        'Ces pages figurent déjà dans vos favoris. Ignorez-les ou conservez-en une autre copie.',
      skip: 'Ignorer les doublons et enregistrer',
      saveAnyway: 'Tout enregistrer quand même',
    },
    closeAfter: {
      title: 'Fermer les onglets d’origine après l’enregistrement',
      description:
        'Seules les pages enregistrées lors de cette collecte seront fermées, et ce choix sera mémorisé.',
    },
    saving: 'Enregistrement…',
    failed:
      'Enregistrement impossible. Vérifiez les autorisations de favoris et d’onglets de l’extension.',
    extensionRequired:
      'Chargez cette application comme extension Chrome pour utiliser la collecte réelle.',
    shortcutHint:
      'Utilisez {{shortcut}} ou le menu contextuel de la page pour collecter.',
    shortcutUnassignedHint:
      'Aucun raccourci n’est attribué ; le menu contextuel reste disponible.',
    newTabHint:
      'Sur la page Nouvel onglet de Prelude, Onglet actuel utilise la dernière page consultée.',
    result: {
      saved_one: '{{count}} page ajoutée à À lire plus tard.',
      saved_other: '{{count}} pages ajoutées à À lire plus tard.',
      savedAndClosed_one:
        '{{count}} page enregistrée et {{closed}} onglets d’origine fermés.',
      savedAndClosed_other:
        '{{count}} pages enregistrées et {{closed}} onglets d’origine fermés.',
      savedWithSkipped_one:
        '{{count}} page enregistrée et {{skipped}} URL en double ignorées.',
      savedWithSkipped_other:
        '{{count}} pages enregistrées et {{skipped}} URL en double ignorées.',
      savedCloseFailed_one:
        '{{count}} page enregistrée, mais les onglets d’origine n’ont pas pu être fermés.',
      savedCloseFailed_other:
        '{{count}} pages enregistrées, mais les onglets d’origine n’ont pas pu être fermés.',
      allDuplicates:
        'Ces URL figurent déjà dans vos favoris, aucune copie n’a donc été créée.',
    },
  },
  search: {
    trigger: 'Rechercher',
    triggerLabel: 'Rechercher dans les favoris et les onglets',
    dialogTitle: 'Rechercher ou saisir une adresse',
    close: 'Fermer la recherche',
    suggestions: 'Suggestions de recherche',
    hintTitle: 'Recherchez dans vos favoris, vos onglets ou sur le Web',
    hintDescription:
      'Saisissez une adresse pour y accéder directement ; le reste sera recherché avec votre moteur par défaut.',
    sources: 'Favoris, onglets et moteur de recherche par défaut de Chrome',
    keyboardHelp: '↑↓ Choisir · Entrée Ouvrir · Échap Fermer',
    visitUrl: 'Accéder à l’adresse',
    searchFor: 'Rechercher « {{query}} »',
    defaultProvider: 'Utiliser le moteur de recherche par défaut de Chrome',
  },
  tabs: {
    pinned: 'Épinglé',
    audible: 'Lecture audio en cours',
    current: 'Actuel',
    emptyTitle: 'Aucun onglet correspondant',
    emptyDescription:
      'Les nouvelles pages apparaîtront automatiquement ici lorsque vous les ouvrirez.',
    currentWindow: 'Fenêtre actuelle',
    window: 'Fenêtre {{number}}',
    errors: {
      sortFailed:
        'Impossible de déplacer l’onglet. L’ordre initial a été restauré.',
    },
    close: {
      action: 'Fermer l’onglet « {{title}} »',
      closing: 'Fermeture de l’onglet « {{title}} »',
      failed: 'Impossible de fermer « {{title}} ». Cliquez pour réessayer',
      extensionRequired:
        'Chargez cette application comme extension Chrome pour fermer des onglets',
    },
    capture: {
      action: 'Collecter « {{title}} » dans À lire plus tard',
      saving: 'Collecte de « {{title}} »',
      saved: '« {{title}} » a été collecté dans À lire plus tard',
      failed: 'Impossible de collecter « {{title}} ». Cliquez pour réessayer',
      bookmarked:
        '« {{title}} » figure déjà dans vos favoris. Cliquez pour le collecter à nouveau',
      extensionRequired:
        'Chargez cette application comme extension Chrome pour collecter cette page',
      unsupported: 'Ce type de page ne peut pas être collecté comme favori',
      duplicateTitle: 'Cette adresse figure déjà dans vos favoris',
      duplicateDescription:
        '« {{title}} » possède déjà un favori. Une nouvelle collecte enregistrera une autre copie dans À lire plus tard.',
      saveAnyway: 'Collecter quand même',
    },
  },
  bookmarks: {
    addFolder: {
      action: 'Ajouter un dossier',
      actionIn: 'Ajouter un dossier dans {{parent}}',
      name: 'Nom du dossier',
      extensionRequired:
        'Chargez cette application comme extension Chrome pour ajouter des dossiers',
    },
    addBookmark: {
      action: 'Ajouter un favori',
      shortAction: 'Ajouter',
      actionIn: 'Ajouter un favori dans {{folder}}',
      url: 'Adresse du favori',
      urlPlaceholder: 'Collez une adresse',
      title: 'Titre du favori',
      titlePlaceholder:
        'Titre (laissez vide pour le récupérer automatiquement)',
      extensionRequired:
        'Chargez cette application comme extension Chrome pour ajouter des favoris',
    },
    actions: {
      copied: 'Lien copié',
      copiedShort: 'Copié',
      copy: 'Copier le lien de {{title}}',
      copyShort: 'Copier le lien',
      openNewTab: 'Ouvrir {{title}} dans un nouvel onglet',
      openNewTabShort: 'Ouvrir dans un nouvel onglet',
      switchToOpenTab: 'Basculer vers l’onglet ouvert pour {{title}}',
      switchToOpenTabShort: 'Basculer vers l’onglet ouvert',
      openTabStatus: 'Ouvert',
      edit: 'Modifier {{title}}',
      editShort: 'Modifier',
      delete: 'Supprimer {{title}}',
      deleteShort: 'Supprimer',
      extensionRequiredModify:
        'Chargez cette application comme extension Chrome pour effectuer des modifications',
    },
    editDialog: {
      title: 'Modifier le favori',
      description:
        'Modifiez le titre ou l’adresse. L’enregistrement mettra à jour vos favoris Chrome.',
      titleLabel: 'Titre',
      urlLabel: 'Adresse',
    },
    deleteDialog: {
      title: 'Supprimer le favori ?',
      description:
        '« {{title}} » sera supprimé de vos favoris Chrome. Cette action est irréversible.',
    },
    folder: {
      collapse: 'Réduire {{title}}',
      expand: 'Développer {{title}}',
      delete: 'Supprimer le dossier {{title}}',
      deleteShort: 'Supprimer le dossier',
      extensionRequiredDelete:
        'Chargez cette application comme extension Chrome pour supprimer des dossiers',
      deleteTitle: 'Supprimer le dossier « {{title}} » ?',
      deleteWithContents:
        'Cette action supprimera également {{summary}} qu’il contient. Cette action est irréversible.',
      deleteEmpty: 'Ce dossier est vide. Sa suppression est irréversible.',
      deleteWithContentsAction: 'Supprimer le dossier et son contenu',
    },
    empty: {
      title: 'Aucun favori correspondant',
      description: 'Essayez un titre, un domaine ou un nom de dossier.',
    },
    errors: {
      folderNameRequired: 'Saisissez un nom de dossier',
      invalidUrl: 'Saisissez une adresse valide',
      addFailed: 'Ajout impossible. Réessayez.',
      saveFailed: 'Impossible d’enregistrer les modifications. Réessayez.',
      deleteFailed: 'Impossible de supprimer le favori. Réessayez.',
      deleteFolderFailed: 'Impossible de supprimer le dossier. Réessayez.',
      sortFailed:
        'Impossible de déplacer le favori. L’ordre initial a été restauré.',
    },
  },
  defaultFolders: {
    names: {
      container: 'Prelude',
      pinned: 'Épinglés',
      readLater: 'À lire plus tard',
      favorites: 'Favoris',
    },
    readyTitle: 'Vos dossiers rapides sont prêts',
    setupTitle: 'Configurez vos dossiers rapides',
    readyDescription:
      'Les dossiers se trouvent maintenant dans les favoris Chrome. Vous pouvez les renommer, les déplacer ou les supprimer à tout moment.',
    setupDescription:
      'Après confirmation, ces dossiers seront créés dans Autres favoris de Chrome. Rien ne sera modifié avant votre confirmation.',
    previewLabel: 'Dossiers qui seront créés',
    containerDescription: 'Créé dans Autres favoris',
    pinnedDescription: 'Regroupez les pages que vous consultez souvent',
    readLaterDescription: 'Enregistrez ce que vous souhaitez lire plus tard',
    favoritesDescription: 'Conservez les pages que vous souhaitez retrouver',
    readyNote:
      'C’est fait. Vous pouvez les utiliser et les gérer depuis la barre latérale.',
    creating: 'Création…',
    retry: 'Réessayer',
    confirm: 'Créer les dossiers',
    extensionRequired:
      'Chargez cette application comme extension Chrome pour créer les dossiers.',
    createFailed:
      'Échec de la création. Vérifiez que l’extension dispose toujours de l’autorisation d’accéder aux favoris, puis réessayez.',
    privacyNote:
      'Les dossiers ne sont pas suivis après leur création ; vous gardez le contrôle de leur nom, de leur emplacement et de leur suppression.',
  },
} satisfies MessageCatalog
