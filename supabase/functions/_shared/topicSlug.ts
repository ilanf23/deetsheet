/** Runtime-neutral URL rules shared by the browser and email functions. */
export function topicSlug(name: string): string {
  return name.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export function decodeTopicParam(param: string): string {
  try {
    return decodeURIComponent(param)
  } catch {
    return param
  }
}

/** Only rewrite first-party topic segments, keeping all other URL bytes intact. */
export function canonicalTopicHref(href: string): string {
  return href.replace(/^(https:\/\/(?:www\.)?deetsheet\.com)?(\/topic\/)([^/?#]+)/i,
    (_match, origin, prefix, name) => `${origin ?? ''}${prefix}${topicSlug(decodeTopicParam(name))}`)
}