/**
 * @typedef {Object} SurfaceInput
 * @property {string} id
 * @property {string} title
 * @property {string} [kind]
 * @property {string[]} [tags]
 */

export class Surface {
  /**
   * @param {SurfaceInput} input
   */
  constructor(input) {
    if (!input?.id || !input?.title) {
      throw new Error('Surface requires both id and title.');
    }

    this.id = input.id;
    this.title = input.title;
    this.kind = input.kind ?? 'note';
    this.tags = [...new Set(input.tags ?? [])];
  }

  /**
   * @returns {SurfaceInput}
   */
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      kind: this.kind,
      tags: [...this.tags]
    };
  }

  /**
   * Build a lightweight UI card payload suitable for list rendering.
   * @returns {{id: string, title: string, subtitle: string, kind: string, badges: string[]}}
   */
  toCard() {
    return {
      id: this.id,
      title: this.title,
      subtitle: `${this.kind.toUpperCase()} · ${this.tags.length} tag${this.tags.length === 1 ? '' : 's'}`,
      kind: this.kind,
      badges: [...this.tags]
    };
  }
}

export class Slate {
  constructor() {
    /** @type {Map<string, Surface>} */
    this.surfaces = new Map();
  }

  /**
   * @param {SurfaceInput} input
   */
  addSurface(input) {
    const surface = new Surface(input);

    if (this.surfaces.has(surface.id)) {
      throw new Error(`Surface with id "${surface.id}" already exists.`);
    }

    this.surfaces.set(surface.id, surface);
    return surface;
  }

  /**
   * @param {string} id
   */
  getSurface(id) {
    return this.surfaces.get(id) ?? null;
  }

  /**
   * @param {string} tag
   */
  byTag(tag) {
    return [...this.surfaces.values()].filter((surface) => surface.tags.includes(tag));
  }

  listSurfaces() {
    return [...this.surfaces.values()];
  }

  /**
   * @param {string} query
   */
  search(query) {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return this.listSurfaces();
    }

    return this.listSurfaces().filter((surface) => {
      const inTitle = surface.title.toLowerCase().includes(normalizedQuery);
      const inKind = surface.kind.toLowerCase().includes(normalizedQuery);
      const inTags = surface.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery));
      return inTitle || inKind || inTags;
    });
  }

  byKind(kind) {
    return this.listSurfaces().filter((surface) => surface.kind === kind);
  }

  cards(query = '') {
    return this.search(query).map((surface) => surface.toCard());
  }
}
