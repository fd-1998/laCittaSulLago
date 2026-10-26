import { podcastFeedUrl } from '../frontpage/siteConfig'

function textFromHtml(html) {
  const document = new DOMParser().parseFromString(html || '', 'text/html')
  return document.body.textContent?.replace(/\s+/g, ' ').trim() ?? ''
}

function getText(node, selector) {
  return node.querySelector(selector)?.textContent?.trim() ?? ''
}

function getNamespacedText(node, localName) {
  return Array.from(node.children).find((child) => child.localName === localName)?.textContent?.trim() ?? ''
}

export async function fetchPodcastFeed(signal) {
  const response = await fetch(podcastFeedUrl, { signal })
  if (!response.ok) {
    throw new Error(`Il feed podcast ha risposto con stato ${response.status}.`)
  }

  const xml = await response.text()
  const document = new DOMParser().parseFromString(xml, 'application/xml')
  const parserError = document.querySelector('parsererror')
  if (parserError) {
    throw new Error('Il feed podcast contiene XML non valido.')
  }

  const channel = document.querySelector('channel')
  if (!channel) {
    throw new Error('Il feed podcast non contiene un canale.')
  }

  const channelImage = Array.from(channel.children)
    .find((child) => child.localName === 'image')
    ?.getAttribute('href') ?? ''

  const episodes = Array.from(channel.querySelectorAll(':scope > item')).map((item, index) => {
    const description = textFromHtml(getText(item, 'description'))
    const episodeImage = Array.from(item.children)
      .find((child) => child.localName === 'image')
      ?.getAttribute('href')

    return {
      id: getText(item, 'guid') || getText(item, 'link') || `episode-${index}`,
      title: getText(item, 'title'),
      description,
      shortDescription: description.length > 220 ? `${description.slice(0, 217).trim()}…` : description,
      link: getText(item, 'link'),
      publishedAt: getText(item, 'pubDate'),
      audioUrl: item.querySelector('enclosure')?.getAttribute('url') ?? '',
      audioType: item.querySelector('enclosure')?.getAttribute('type') ?? 'audio/mpeg',
      duration: getNamespacedText(item, 'duration'),
      number: getNamespacedText(item, 'episode'),
      type: getNamespacedText(item, 'episodeType'),
      image: episodeImage || channelImage,
    }
  })

  return {
    title: getText(channel, 'title'),
    description: getText(channel, 'description'),
    image: channelImage,
    episodes,
  }
}
