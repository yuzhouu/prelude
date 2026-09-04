import type { MessageCatalog } from './zh-CN'

export const es = {
  app: {
    name: 'Prelude',
    description:
      'Una nueva pestaña para marcadores, pestañas abiertas y Leer más tarde. Sus datos permanecen en local.',
  },
  common: {
    cancel: 'Cancelar',
    save: 'Guardar',
    delete: 'Eliminar',
    unnamedFolder: 'Carpeta sin nombre',
    bookmarkCount_one: '{{count}} marcador',
    bookmarkCount_other: '{{count}} marcadores',
    childFolderCount_one: '{{count}} subcarpeta',
    childFolderCount_other: '{{count}} subcarpetas',
    tabCount_one: '{{count}} pestaña',
    tabCount_other: '{{count}} pestañas',
    listSeparator: ' y ',
  },
  navigation: {
    quickFolders: 'Hoy',
    currentTabs: 'Pestañas actuales',
    recent: 'Añadidos recientemente',
    allBookmarks: 'Todos los marcadores',
    bookmarks: 'Marcadores',
    folders: 'Carpetas',
    bookmarkNavigation: 'Navegación de marcadores',
    currentLocation: 'Ubicación actual',
    openFolderNavigation: 'Abrir navegación de carpetas',
    closeFolderNavigation: 'Cerrar navegación de carpetas',
    collapseSidebar: 'Contraer barra lateral',
    expandSidebar: 'Expandir barra lateral',
  },
  sync: {
    allBookmarksStatus:
      'Estado de sincronización de los marcadores: {{status}}',
    unknown: {
      label: 'Estado desconocido',
      title:
        'Esta versión de Chrome no muestra el estado de sincronización de todos los marcadores',
    },
    synced: {
      label: 'Todo sincronizado',
      title: 'Todos los marcadores están sincronizados con tu cuenta de Chrome',
    },
    partial: {
      label: 'Sincronización parcial',
      title:
        'Algunos marcadores se sincronizan con Chrome y otros se guardan localmente',
    },
    local: {
      label: 'Solo local',
      title:
        'Todos los marcadores se guardan localmente y no se sincronizan con Chrome',
    },
  },
  theme: {
    groupLabel: 'Tema visual',
    system: 'Usar configuración del sistema',
    light: 'Claro',
    dark: 'Oscuro',
  },
  language: {
    label: 'Idioma',
    groupLabel: 'Idioma de la interfaz',
    zhCN: 'Chino simplificado',
    en: 'Inglés',
    ja: 'Japonés',
    es: 'Español',
    fr: 'Francés',
    ru: 'Ruso',
  },
  settings: {
    open: 'Abrir configuración',
    close: 'Cerrar configuración',
    title: 'Configuración',
    description: 'Gestiona la interfaz de Prelude y consulta el uso de datos.',
    privacy: {
      title: 'Datos y privacidad',
      summary:
        'Prelude solo trata los datos del navegador necesarios para gestionar marcadores, pestañas y Leer más tarde.',
      bookmarks:
        'Lee y modifica los marcadores y carpetas de Chrome que gestionas.',
      tabs: 'Lee títulos y URL de pestañas abiertas para mostrarlas, buscarlas y guardarlas.',
      local:
        'Los datos de marcadores y pestañas permanecen en local; no se venden ni usan para publicidad.',
      search:
        'Solo las búsquedas web que envías se entregan al buscador predeterminado de Chrome.',
      action: 'Leer la política de privacidad',
    },
  },
  capture: {
    open: 'Guardar',
    close: 'Cerrar panel de guardado',
    eyebrow: 'Opciones de guardado',
    title: 'Guardar en Leer más tarde',
    description:
      'Reúne primero las páginas sueltas y organízalas durante tu revisión diaria.',
    currentPage: {
      title: 'Pestaña actual',
      empty: 'No hay ninguna página que guardar en esta ventana',
      action: 'Añadir a Leer más tarde',
    },
    currentWindow: {
      title: 'Ventana actual',
      description_one: 'Guardar {{count}} página de esta ventana',
      description_other: 'Guardar {{count}} páginas de esta ventana',
      action: 'Guardar ventana',
    },
    currentGroup: {
      title: 'Grupo de pestañas actual',
      description_one: '{{count}} página en «{{title}}»',
      description_other: '{{count}} páginas en «{{title}}»',
      empty:
        'La página vista más recientemente no pertenece a un grupo de pestañas',
      action: 'Guardar grupo de pestañas',
    },
    duplicates: {
      title_one: 'Se encontró {{count}} URL duplicada',
      title_other: 'Se encontraron {{count}} URL duplicadas',
      description:
        'Estas páginas ya están en tus marcadores. Puedes omitirlas o guardar otra copia.',
      skip: 'Omitir duplicados y guardar',
      saveAnyway: 'Guardar todo de todos modos',
    },
    closeAfter: {
      title: 'Cerrar las pestañas originales después de guardar',
      description:
        'Solo se cerrarán las páginas guardadas correctamente y se recordará esta opción.',
    },
    saving: 'Guardando…',
    failed:
      'No se pudo guardar. Comprueba los permisos de marcadores y pestañas de la extensión.',
    extensionRequired:
      'Carga la aplicación como extensión de Chrome para usar el guardado real.',
    shortcutHint:
      'Usa Alt + Mayús + S o el menú contextual de la página para guardar.',
    newTabHint:
      'En la página de nueva pestaña de Prelude, Pestaña actual usa la página vista más recientemente.',
    result: {
      saved_one: 'Se añadió {{count}} página a Leer más tarde.',
      saved_other: 'Se añadieron {{count}} páginas a Leer más tarde.',
      savedAndClosed_one:
        'Se guardó {{count}} página y se cerraron {{closed}} pestañas originales.',
      savedAndClosed_other:
        'Se guardaron {{count}} páginas y se cerraron {{closed}} pestañas originales.',
      savedWithSkipped_one:
        'Se guardó {{count}} página y se omitieron {{skipped}} URL duplicadas.',
      savedWithSkipped_other:
        'Se guardaron {{count}} páginas y se omitieron {{skipped}} URL duplicadas.',
      savedCloseFailed_one:
        'Se guardó {{count}} página, pero no se pudieron cerrar las pestañas originales.',
      savedCloseFailed_other:
        'Se guardaron {{count}} páginas, pero no se pudieron cerrar las pestañas originales.',
      allDuplicates:
        'Estas URL ya estaban en tus marcadores, así que no se crearon copias.',
    },
  },
  search: {
    trigger: 'Buscar',
    triggerLabel: 'Buscar marcadores y pestañas',
    dialogTitle: 'Buscar o escribir una dirección',
    close: 'Cerrar búsqueda',
    suggestions: 'Sugerencias de búsqueda',
    hintTitle: 'Busca marcadores, pestañas o en la web',
    hintDescription:
      'Escribe una dirección para visitarla directamente; el resto se buscará con tu motor predeterminado.',
    sources:
      'Marcadores, pestañas y motor de búsqueda predeterminado de Chrome',
    keyboardHelp: '↑↓ Elegir · Intro Abrir · Esc Cerrar',
    visitUrl: 'Visitar dirección',
    searchFor: 'Buscar «{{query}}»',
    defaultProvider: 'Usar el motor de búsqueda predeterminado de Chrome',
  },
  tabs: {
    pinned: 'Fijada',
    audible: 'Reproduciendo audio',
    current: 'Actual',
    emptyTitle: 'No hay pestañas que coincidan',
    emptyDescription:
      'Las páginas nuevas aparecerán aquí automáticamente cuando las abras.',
    currentWindow: 'Ventana actual',
    window: 'Ventana {{number}}',
    errors: {
      sortFailed: 'No se pudo mover la pestaña. Se restauró el orden original.',
    },
    close: {
      action: 'Cerrar la pestaña «{{title}}»',
      closing: 'Cerrando la pestaña «{{title}}»',
      failed:
        'No se pudo cerrar «{{title}}». Haz clic para intentarlo de nuevo',
      extensionRequired:
        'Carga la aplicación como extensión de Chrome para cerrar pestañas',
    },
    capture: {
      action: 'Guardar «{{title}}» en Leer más tarde',
      saving: 'Guardando «{{title}}»',
      saved: '«{{title}}» se guardó en Leer más tarde',
      failed:
        'No se pudo guardar «{{title}}». Haz clic para intentarlo de nuevo',
      bookmarked:
        '«{{title}}» ya está en tus marcadores. Haz clic para volver a guardarlo',
      extensionRequired:
        'Carga la aplicación como extensión de Chrome para guardar esta página',
      unsupported: 'Este tipo de página no se puede guardar como marcador',
      duplicateTitle: 'Esta dirección ya está en tus marcadores',
      duplicateDescription:
        '«{{title}}» ya tiene un marcador. Si vuelves a guardarlo, se creará otra copia en Leer más tarde.',
      saveAnyway: 'Guardar de todos modos',
    },
  },
  bookmarks: {
    addFolder: {
      action: 'Añadir carpeta',
      actionIn: 'Añadir una carpeta en {{parent}}',
      name: 'Nombre de la carpeta',
      extensionRequired:
        'Carga la aplicación como extensión de Chrome para añadir carpetas',
    },
    addBookmark: {
      action: 'Añadir marcador',
      shortAction: 'Añadir',
      actionIn: 'Añadir un marcador en {{folder}}',
      url: 'Dirección del marcador',
      urlPlaceholder: 'Pega una dirección',
      title: 'Título del marcador',
      titlePlaceholder: 'Título (déjalo vacío para obtenerlo automáticamente)',
      extensionRequired:
        'Carga la aplicación como extensión de Chrome para añadir marcadores',
    },
    actions: {
      copied: 'Enlace copiado',
      copiedShort: 'Copiado',
      copy: 'Copiar el enlace de {{title}}',
      copyShort: 'Copiar enlace',
      openNewTab: 'Abrir {{title}} en una pestaña nueva',
      openNewTabShort: 'Abrir en una pestaña nueva',
      switchToOpenTab: 'Cambiar a la pestaña abierta de {{title}}',
      switchToOpenTabShort: 'Cambiar a la pestaña abierta',
      openTabStatus: 'Abierta',
      edit: 'Editar {{title}}',
      editShort: 'Editar',
      delete: 'Eliminar {{title}}',
      deleteShort: 'Eliminar',
      extensionRequiredModify:
        'Carga la aplicación como extensión de Chrome para hacer cambios',
    },
    editDialog: {
      title: 'Editar marcador',
      description:
        'Cambia el título o la dirección. Al guardar se actualizarán tus marcadores de Chrome.',
      titleLabel: 'Título',
      urlLabel: 'Dirección',
    },
    deleteDialog: {
      title: '¿Eliminar marcador?',
      description:
        '«{{title}}» se eliminará de tus marcadores de Chrome. Esta acción no se puede deshacer.',
    },
    folder: {
      collapse: 'Contraer {{title}}',
      expand: 'Expandir {{title}}',
      delete: 'Eliminar carpeta {{title}}',
      deleteShort: 'Eliminar carpeta',
      extensionRequiredDelete:
        'Carga la aplicación como extensión de Chrome para eliminar carpetas',
      deleteTitle: '¿Eliminar la carpeta «{{title}}»?',
      deleteWithContents:
        'También se eliminarán {{summary}} de su interior. Esta acción no se puede deshacer.',
      deleteEmpty: 'Esta carpeta está vacía. Eliminarla no se puede deshacer.',
      deleteWithContentsAction: 'Eliminar carpeta y contenido',
    },
    empty: {
      title: 'No hay marcadores que coincidan',
      description: 'Prueba con un título, dominio o nombre de carpeta.',
    },
    errors: {
      folderNameRequired: 'Escribe un nombre para la carpeta',
      invalidUrl: 'Escribe una dirección válida',
      addFailed: 'No se pudo añadir. Inténtalo de nuevo.',
      saveFailed: 'No se pudieron guardar los cambios. Inténtalo de nuevo.',
      deleteFailed: 'No se pudo eliminar el marcador. Inténtalo de nuevo.',
      deleteFolderFailed: 'No se pudo eliminar la carpeta. Inténtalo de nuevo.',
      sortFailed:
        'No se pudo mover el marcador. Se restauró el orden original.',
    },
  },
  defaultFolders: {
    names: {
      container: 'Prelude',
      pinned: 'Fijados',
      readLater: 'Leer más tarde',
      favorites: 'Favoritos',
    },
    readyTitle: 'Tus carpetas rápidas están listas',
    setupTitle: 'Configura tus carpetas rápidas',
    readyDescription:
      'Las carpetas ya están en los marcadores de Chrome. Puedes cambiarles el nombre, moverlas o eliminarlas cuando quieras.',
    setupDescription:
      'Cuando confirmes, estas carpetas se crearán en Otros marcadores de Chrome. No se cambiará nada hasta entonces.',
    previewLabel: 'Carpetas que se crearán',
    containerDescription: 'Se crea en Otros marcadores',
    pinnedDescription: 'Agrupa las páginas que visitas con frecuencia',
    readLaterDescription: 'Guarda lo que quieras leer más tarde',
    favoritesDescription: 'Conserva las páginas a las que quieras volver',
    readyNote:
      'Listo. Ya puedes usarlas y gestionarlas desde la barra lateral.',
    creating: 'Creando…',
    retry: 'Intentar de nuevo',
    confirm: 'Crear carpetas',
    extensionRequired:
      'Carga la aplicación como extensión de Chrome para crear carpetas.',
    createFailed:
      'No se pudieron crear. Comprueba que la extensión tenga permiso para usar marcadores e inténtalo de nuevo.',
    privacyNote:
      'Las carpetas no se rastrean después de crearlas; tú controlas sus nombres, su ubicación y su eliminación.',
  },
} satisfies MessageCatalog
