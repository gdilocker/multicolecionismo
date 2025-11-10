export const CONTENT_LIMITS = {
  BIO: {
    MAX_LENGTH: 200,
    ERROR_MESSAGE: 'A biografia deve ter no máximo 200 caracteres.',
  },

  LINKS: {
    STANDARD_MAX: 5,
    ELITE_MAX: 10,
    SUPREME_MAX: 10,
    ERROR_MESSAGE_STANDARD: 'Você atingiu o limite de 5 links do plano Standard.',
    ERROR_MESSAGE_PREMIUM: 'Você atingiu o limite de 10 links permitidos.',
  },

  POSTS: {
    TEXT_MAX_LENGTH: 500,
    MEDIA_MAX_COUNT: 5,
    MEDIA_MAX_SIZE_MB: 10,
    MEDIA_MAX_SIZE_BYTES: 10 * 1024 * 1024,
    ERROR_MESSAGE_TEXT: 'O post deve ter no máximo 500 caracteres.',
    ERROR_MESSAGE_MEDIA: 'Você pode adicionar no máximo 5 mídias por post.',
    ERROR_MESSAGE_SIZE: 'Cada arquivo deve ter no máximo 10MB.',
  },

  COMMENTS: {
    MAX_LENGTH: 250,
    ERROR_MESSAGE: 'O comentário deve ter no máximo 250 caracteres.',
  },

  USERNAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 15,
    PATTERN: /^[a-z0-9.]+$/,
    ERROR_MESSAGE_LENGTH: 'O nome do domínio deve ter entre 2 e 15 caracteres.',
    ERROR_MESSAGE_PATTERN: 'O nome do domínio deve conter apenas letras minúsculas, números e ponto.',
    ERROR_MESSAGE_FULL: 'O nome do domínio deve ter entre 2 e 15 caracteres e conter apenas letras, números e ponto.',
  },

  DISPLAY_NAME: {
    MAX_LENGTH: 40,
    ERROR_MESSAGE: 'O nome de exibição deve ter no máximo 40 caracteres.',
  },

  EXTRA_FIELDS: {
    MAX_LENGTH: 50,
    MAX_COUNT: 5,
    ERROR_MESSAGE_LENGTH: 'Este campo deve ter no máximo 50 caracteres.',
    ERROR_MESSAGE_COUNT: 'Você pode adicionar no máximo 5 campos extras.',
  },

  DIRECT_MESSAGES: {
    TEXT_MAX_LENGTH: 1000,
    MEDIA_MAX_COUNT: 3,
    ERROR_MESSAGE_TEXT: 'A mensagem deve ter no máximo 1.000 caracteres.',
    ERROR_MESSAGE_MEDIA: 'Você pode anexar no máximo 3 arquivos por mensagem.',
  },

  HASHTAGS: {
    MAX_COUNT: 10,
    ERROR_MESSAGE: 'Você pode adicionar no máximo 10 hashtags por post.',
  },

  BIO_LINKS: {
    MAX_COUNT: 3,
    ERROR_MESSAGE: 'Você pode adicionar no máximo 3 links clicáveis na biografia.',
  },
} as const;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateBio(bio: string): ValidationResult {
  if (bio.length > CONTENT_LIMITS.BIO.MAX_LENGTH) {
    return { valid: false, error: CONTENT_LIMITS.BIO.ERROR_MESSAGE };
  }
  return { valid: true };
}

export function validateUsername(username: string): ValidationResult {
  if (username.length < CONTENT_LIMITS.USERNAME.MIN_LENGTH || username.length > CONTENT_LIMITS.USERNAME.MAX_LENGTH) {
    return { valid: false, error: CONTENT_LIMITS.USERNAME.ERROR_MESSAGE_LENGTH };
  }
  if (!CONTENT_LIMITS.USERNAME.PATTERN.test(username)) {
    return { valid: false, error: CONTENT_LIMITS.USERNAME.ERROR_MESSAGE_PATTERN };
  }
  return { valid: true };
}

export function validateDisplayName(name: string): ValidationResult {
  if (name.length > CONTENT_LIMITS.DISPLAY_NAME.MAX_LENGTH) {
    return { valid: false, error: CONTENT_LIMITS.DISPLAY_NAME.ERROR_MESSAGE };
  }
  return { valid: true };
}

export function validatePostText(text: string): ValidationResult {
  if (text.length > CONTENT_LIMITS.POSTS.TEXT_MAX_LENGTH) {
    return { valid: false, error: CONTENT_LIMITS.POSTS.ERROR_MESSAGE_TEXT };
  }
  return { valid: true };
}

export function validateCommentText(text: string): ValidationResult {
  if (text.length > CONTENT_LIMITS.COMMENTS.MAX_LENGTH) {
    return { valid: false, error: CONTENT_LIMITS.COMMENTS.ERROR_MESSAGE };
  }
  return { valid: true };
}

export function validateLinksCount(count: number, planName: string): ValidationResult {
  const isStandard = planName === 'Standard' || planName === 'standard';
  const maxLinks = isStandard ? CONTENT_LIMITS.LINKS.STANDARD_MAX : CONTENT_LIMITS.LINKS.ELITE_MAX;

  if (count >= maxLinks) {
    return {
      valid: false,
      error: isStandard ? CONTENT_LIMITS.LINKS.ERROR_MESSAGE_STANDARD : CONTENT_LIMITS.LINKS.ERROR_MESSAGE_PREMIUM
    };
  }
  return { valid: true };
}

export function validateMediaCount(count: number): ValidationResult {
  if (count > CONTENT_LIMITS.POSTS.MEDIA_MAX_COUNT) {
    return { valid: false, error: CONTENT_LIMITS.POSTS.ERROR_MESSAGE_MEDIA };
  }
  return { valid: true };
}

export function validateMediaSize(sizeBytes: number): ValidationResult {
  if (sizeBytes > CONTENT_LIMITS.POSTS.MEDIA_MAX_SIZE_BYTES) {
    return { valid: false, error: CONTENT_LIMITS.POSTS.ERROR_MESSAGE_SIZE };
  }
  return { valid: true };
}

export function validateExtraField(text: string): ValidationResult {
  if (text.length > CONTENT_LIMITS.EXTRA_FIELDS.MAX_LENGTH) {
    return { valid: false, error: CONTENT_LIMITS.EXTRA_FIELDS.ERROR_MESSAGE_LENGTH };
  }
  return { valid: true };
}

export function validateHashtagsCount(count: number): ValidationResult {
  if (count > CONTENT_LIMITS.HASHTAGS.MAX_COUNT) {
    return { valid: false, error: CONTENT_LIMITS.HASHTAGS.ERROR_MESSAGE };
  }
  return { valid: true };
}
