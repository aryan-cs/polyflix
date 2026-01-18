// Image pools for different categories/keywords
const IMAGE_POOLS = {
  bitcoin: [
    "https://www.experian.com/blogs/ask-experian/wp-content/uploads/Bitcoin.jpg.webp",
    "https://cdn.zonebourse.com/static/resize/768/432//images//reuters/2025-10/2025-10-10T210603Z_1_LYNXNPEL9911T_RTROPTP_4_FINTECH-CRYPTO-FLOWS.JPG",
    "https://cloudfront-us-east-2.images.arcpublishing.com/reuters/UABNLZ53JNOSTLD5H56MOAEPK4.jpg",
    "https://cdn.prod.website-files.com/636a159209fc4a2dd6074cb6/67b2bef7150f86e90321bdf8_Bitcoin.jpg",
  ],
  beast: [
    "https://i.ytimg.com/vi/C9Qfcjf7L-I/maxresdefault.jpg",
    "https://m.media-amazon.com/images/S/pv-target-images/ce689202927ce880eec6ca93e6462c69c5568d7aff03ec27d4402de05aa3e619._SX1080_FMjpg_.jpg",
    "https://www.prg.com/en/-/jssmedia/US/Images/News/2025/Q1/Beast-Games/1920x1080-MrBeast.ashx?mw=800&webp=True",
    "https://d32qys9a6wm9no.cloudfront.net/images/tvs/backdrop/43/8e777775364fe2a967294f264c28a98e_1280x720.jpg?t=1732608653",
    "https://i.guim.co.uk/img/media/3ace432d4a2e662e6faa18fec3ceeb57319cb845/66_29_2250_1799/master/2250.jpg?width=1200&quality=85&auto=format&fit=max&s=59e8e7642bbb64b5ecca1bbe554a1d1b",
    "https://images.thedirect.com/media/article_full/beast-games-top-10.jpg",
    "https://cdn.mos.cms.futurecdn.net/B44z8UiCeqaPXptnD29wsa-1200-80.jpg",
  ],
  ethereum: [
    "https://www.tbstat.com/cdn-cgi/image/f=avif,q=50/wp/uploads/2022/08/20220802_Ethereum-Merge-1-1200x675.jpg",
    "https://www.virtune.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fethereum.6f7ea727.png&w=3840&q=75&dpl=dpl_7rA8E7X257ZYhcpAoeu7hgkx3ZE4",
    "https://www.lynalden.com/wp-content/uploads/ethereum-feature-image.png",
    "https://cdn.bitpanda.com/media/240522_Spot%20ETH%20Ethereum%20ETFs_Blog_2000x1200.png",
    "https://hdx-prod-v2-cms-fargate-stack-upload-bucket.s3.us-east-1.amazonaws.com/hashdex_ai_a_hand_holding_an_ethereum_coin_and_price_charts_on_f790f5b0_19c0_4408_a9e2_a52d29b8bba1_1abc65a11e.png",
    "https://academy-public.coinmarketcap.com/optimized-uploads/4efd2318b4774fbaa8a88cfb55f25483.jpg"
  ],
  trump: [
    "https://i.abcnewsfe.com/a/4803f95f-d790-4370-8f0d-e943d8b1b9bd/donald-trump-2-rt-gmh-260115_1768486038578_hpMain.jpg",
    "https://i.abcnewsfe.com/a/4803f95f-d790-4370-8f0d-e943d8b1b9bd/donald-trump-2-rt-gmh-260115_1768486038578_hpMain.jpg",
    "https://www.americanprogress.org/wp-content/uploads/sites/2/2025/03/GettyImages-2203672202cropped.jpg?w=1680",
    "https://s.abcnews.com/images/US/donald-trump-10-ap-gmh-241106_1730906289206_hpMain_16x9_1600.jpg",
    "https://npr.brightspotcdn.com/dims3/default/strip/false/crop/4890x3260+0+0/resize/1100/quality/50/format/jpeg/?url=http%3A%2F%2Fnpr-brightspot.s3.amazonaws.com%2Feb%2F26%2F3424469c4d29b63b0b2683c3a4f2%2Fap24161743821924.jpg",
    "https://platform.vox.com/wp-content/uploads/sites/2/2024/11/GettyImages-1259028789.jpg?quality=90&strip=all&crop=0%2C0.0041760628079786%2C100%2C99.991647874384&w=2400"
  ],
  politics: [
    "https://res.cloudinary.com/aenetworks/image/upload/c_fill,ar_2,w_3840,h_1920,g_auto/dpr_auto/f_auto/q_auto:eco/v1/gettyimages-938823062?_a=BAVAZGID0",
    "https://media.architecturaldigest.com/photos/6559735fb796d428bef00d25/4:3/w_4948,h_3711,c_limit/GettyImages-1731443210.jpg",
    "https://platform.vox.com/wp-content/uploads/sites/2/chorus/uploads/chorus_asset/file/7435417/AP_16117036261135.jpg?quality=90&strip=all&crop=8.5696670776819%2C18.434032059186%2C77.990135635019%2C77.990135635019&w=750",
    "https://static01.nyt.com/images/2020/02/19/opinion/19warzelWeb/merlin_169084596_07dcae00-762e-41ad-bc7c-65ffc7b10571-superJumbo.jpg?quality=75&auto=webp"
  ],
  sports: [
    "https://media.cnn.com/api/v1/images/stellar/prod/2025-06-14t032500z-1766838514-mt1usatoday26444867-rtrmadp-3-nba-finals-oklahoma-city-thunder-at-indiana-pacers.jpg?c=16x9&q=h_833,w_1480,c_fill",
    "https://npr.brightspotcdn.com/dims3/default/strip/false/crop/3000x2000+0+0/resize/1100/quality/50/format/jpeg/?url=http%3A%2F%2Fnpr-brightspot.s3.amazonaws.com%2F83%2F0a%2F4819d5714d2f9937bdaa32ef8908%2Fgettyimages-2218021881.jpg",
    "https://andscape.com/wp-content/uploads/2025/06/GettyImages-2221009435-e1750601222963.jpg?w=800",
    "https://bloximages.chicago2.vip.townnews.com/bozemandailychronicle.com/content/tncms/assets/v3/editorial/d/5f/d5fb571c-eadc-5840-9c9d-8db6969b6dbe/696b00bf84d10.image.jpg?resize=750%2C500",
    "https://cdn.nba.com/teams/uploads/sites/1610612741/2026/01/260116_SamSmith_NikolaVucevic_BrooklynNets_16x9.jpg?im=Resize=(640)",
    "https://media.wired.com/photos/6882789913cec3f5361b5c29/3:2/w_1920,c_limit/Summer%20League%204.jpg",
    "https://www.gannett-cdn.com/authoring/authoring-images/2025/12/18/SAUB/87828000007-2190323928.jpg?crop=2999,1687,x0,y264",
    "https://www.novibet.ie/blog-assets/wp-content/uploads/2025/08/Lebron-time-1068x712.jpg"
  ],
  finance: [
    "https://live.staticflickr.com/65535/17123251389_80282733ce_b.jpg",
    "https://static.vecteezy.com/system/resources/previews/006/741/598/non_2x/stock-market-trading-numbers-investment-in-money-stocks-grow-profit-and-financial-profits-free-photo.jpg",
    "https://cdn.theatlantic.com/thumbor/nW4mtXPSHmG2uOpX_Rhh4njqKDA=/0x414:6524x4084/1600x900/media/img/mt/2018/01/RTS1HCV8/original.jpg",
    "https://images.squarespace-cdn.com/content/v1/613411ae18bf5927518c381e/1711418784898-1C8H8Z4OVMMGUPN9PJJC/image-asset.jpeg"
  ]
};

// Fallback images if nothing matches
const DEFAULT_IMAGES = [
  "https://images.unsplash.com/photo-1516245834210-c4c14278733f?w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1531297461136-82lw9b2168c?w=400&auto=format&fit=crop"
];

const stringToHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

export const getMarketImage = (market) => {
  if (!market) return DEFAULT_IMAGES[0];

  const title = (market.title || market.question || "").toLowerCase();
  const category = (market.category || "").toLowerCase();
  const originalImage = market.image || market.icon || null;
  const idHash = market.id ? stringToHash(market.id.toString()) : stringToHash(title);

  // For sports and pop culture, use the Polymarket-provided photo
  if (title.includes('nfl') || title.includes('sport') || 
      title.includes('music') || title.includes('taylor') || 
      title.includes('song') || title.includes('spotify')) {
    return originalImage; // Return null if no image, let placeholder handle it
  }

  let pool = [];

  // Determine which pool to use based on keywords
  // Check for specific keywords first (more specific -> less specific)
  if (title.includes('bitcoin') || title.includes('btc')) {
    pool = IMAGE_POOLS.bitcoin;
  } else if (title.includes('eth') || title.includes('ethereum')) {
    pool = IMAGE_POOLS.ethereum;
  } else if (title.includes('trump') || title.includes('maga') || title.includes('republican')) {
    pool = IMAGE_POOLS.trump;
  } else if (title.includes('biden') || title.includes('harris') || title.includes('democrat') || title.includes('election')) {
    pool = IMAGE_POOLS.politics;
  } else if (title.includes('nba')) {
    pool = [...IMAGE_POOLS.sports];
  } else if (title.includes('beast')) {
    pool = [...IMAGE_POOLS.beast];
  } else if (category === 'crypto') {
    pool = [...IMAGE_POOLS.bitcoin, ...IMAGE_POOLS.ethereum];
  } else if (category === 'politics') {
    pool = [...IMAGE_POOLS.trump, ...IMAGE_POOLS.politics];
  } else if (category === 'finance' || category === 'business') {
    pool = IMAGE_POOLS.finance;
  } else {
    // If no match, try to use original image, otherwise fallback to default pool
    if (originalImage) return originalImage;
    pool = DEFAULT_IMAGES;
  }

  // Select an image from the pool based on the hash
  const index = idHash % pool.length;
  return pool[index];
};