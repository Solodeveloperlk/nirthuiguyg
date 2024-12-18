const axios = require('axios');
const cheerio = require('cheerio');
const {
  cmd,
  commands
} = require('../command');

// Command handler for searching cartoons
cmd({
  pattern: "ginisisila",
  react: '📑',
  category: "download",
  desc: "ginisisilacartoon.net",
  filename: __filename
}, async (conn, m, mek, {
  from,
  q,
  isDev,
  reply
}) => {
  try {
    if (!q) {
      return await reply('*Please provide a search query! (e.g., Garfield)*');
    }

    // Construct the search URL

    const response = await axios.get(`https://ginisisilacartoon.net/search.php?q=${encodeURIComponent(q)}`);
    const $ = cheerio.load(response.data);

    //scrape the episode details
    let episodes = [];
    $("div.inner-video-cell").each((_0x5d4c87, _0x20e27c) => {
      const _0x5ccb66 = $(_0x20e27c).find("div.video-title > a").attr("title");
      const _0x378061 = $(_0x20e27c).find("div.posted-time").text().trim();
      const _0x1fb85e = $(_0x20e27c).find("div.video-title > a").attr("href");
      const _0x52d3a3 = $(_0x20e27c).find("div.inner-video-thumb-wrapper img").attr("src");
      if (_0x5ccb66 && _0x1fb85e) {
        episodes.push({
          'title': _0x5ccb66,
          'postedTime': _0x378061,
          'episodeLink': "https://ginisisilacartoon.net/" + _0x1fb85e,
          'imageUrl': _0x52d3a3
        });
      }
    });
    // If no episodes found
    if (episodes.length === 0) {
      return await reply(`No results found for: ${q}`);
    }

    // Prepare message info
    let info = `📺 Search Results for *${q}:*\n\n`;
    episodes.forEach((ep, index) => {
      info += `*${index + 1}.* ${ep.title}\n🗓️ Posted: ${ep.postedTime}\n🔗 Link: ${ep.episodeLink}\n\n`;
    });

    // Send the compiled information
    const sentMsg = await conn.sendMessage(from, {
      text: info
    }, {
      quoted: mek
    });
    const messageID = sentMsg.key.id; // Save the message ID for later reference

    // Listen for the user's response
    conn.ev.on('messages.upsert', async messageUpdate => {
      const mek = messageUpdate.messages[0];
      if (!mek.message) {
        return;
      }
      const messageType = mek.message.conversation || mek.message.extendedTextMessage?.text;
      const from = mek.key.remoteJid;

      // Check if the message is a reply to the previously sent message
      const isReplyToSentMsg = mek.message.extendedTextMessage && mek.message.extendedTextMessage.contextInfo.stanzaId === messageID;
      if (isReplyToSentMsg) {
        const selectedNumber = parseInt(messageType.trim());
        if (!isNaN(selectedNumber) && selectedNumber > 0 && selectedNumber <= episodes.length) {
          const selectedEpisode = episodes[selectedNumber - 1];

          // Send episode details with image first

          const imageMessage = {
            image: {
              url: selectedEpisode.imageUrl
            },
            caption: `*🪄 නම:-* ${selectedEpisode.title}\n⏳ *දිනය:-* ${selectedEpisode.postedTime}\n📎 *එපි ලින්ක්*:- ${selectedEpisode.episodeLink}\n\n *We are uploading the Movie/Episode you requested.*`
          };
          await conn.sendMessage(from, imageMessage, {
            quoted: mek
          });

          // Fetch the episode page to extract the video link (iframe src)
          const episodePageResponse = await axios.get(selectedEpisode.episodeLink);
          const $ = cheerio.load(episodePageResponse.data);

          //gifted ginisisila dl links
          const iframeSrc = $("div#player-holder iframe").attr("src");
          if (iframeSrc) {
            const apiUrl = 'https://api.fgmods.xyz/api/downloader/gdrive?url=' + iframeSrc + "&apikey=mnp3grlZ";
            try {
              const downloadResponse = await axios.get(apiUrl);
              const downloadUrl = downloadResponse.data.result.downloadUrl;
              if (downloadUrl) {
                await conn.sendMessage(from, {
                  'document': {
                    'url': downloadUrl
                  },
                  'mimetype': "video/mp4",
                  'fileName': "GIFTED-GINISISILA | " + selectedEpisode.title + '.mp4',
                  'caption': selectedEpisode.title + " |  GIFTED BY QUEEN-ZAZIE-MD OWNER"
                }, {
                  'quoted': mek
                });
              } else {
                await reply("Failed to retrieve the download link for this episode.");
              }
            } catch (_0x46b0f1) {
              console.error("Error fetching the download link:", _0x46b0f1);
              await reply("An error occurred while trying to fetch the download link.");
            }
          } else {
            await reply('No downloadable link found for this episode.');
          }
        } else {
          await reply(`Please reply with a valid number from the list.`);
        }
      }
    });
  } catch (e) {
    reply('*Error occurred while scraping!*');
    console.error(e);
  }
});

// මෙකෙ එපි details & search result styles හැර අනිකුත් කිසිම දෙයක් වෙනස් කරන්න එපා...乡Qҽҽɳ-乙azie-MultiDevice࿐
