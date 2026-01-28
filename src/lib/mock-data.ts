import type { LinkedInPost, YouTubePost, InstagramPost, SkoolPost, Post, TrackedProfile, TrackedContent, DashboardStats } from './types'

// Mock Posts - Starting empty, no pre-published posts
export const MOCK_LINKEDIN_POSTS: LinkedInPost[] = []

export const MOCK_YOUTUBE_POSTS: YouTubePost[] = []

export const MOCK_INSTAGRAM_POSTS: InstagramPost[] = []

export const MOCK_SKOOL_POSTS: SkoolPost[] = []

export const MOCK_POSTS: Post[] = [
  ...MOCK_LINKEDIN_POSTS,
  ...MOCK_YOUTUBE_POSTS,
  ...MOCK_INSTAGRAM_POSTS,
  ...MOCK_SKOOL_POSTS
]

// Mock Tracked Profiles - Real creator data (all 104 creators)
export const MOCK_TRACKED_PROFILES: TrackedProfile[] = [
  // ===================== LINKEDIN PROFILES (58) =====================
  { id: 'li-1', platform: 'linkedin', name: 'Nate Herkelman', handle: 'nateherkelman', followers: 45000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-07-21T10:00:00Z', url: 'https://www.linkedin.com/in/nateherkelman/' },
  { id: 'li-2', platform: 'linkedin', name: 'Robertoh Luna', handle: 'robertohluna', followers: 32000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-07-21T10:00:00Z', url: 'https://www.linkedin.com/in/robertohluna' },
  { id: 'li-3', platform: 'linkedin', name: 'Michele Torti', handle: 'michele-torti', followers: 28000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-07-21T10:00:00Z', url: 'https://www.linkedin.com/in/michele-torti/' },
  { id: 'li-4', platform: 'linkedin', name: 'Nickolas Saraev', handle: 'nickolas-saraev', followers: 89000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-07-21T10:00:00Z', url: 'https://www.linkedin.com/in/nickolas-saraev' },
  { id: 'li-5', platform: 'linkedin', name: 'Bjion Henry', handle: 'bjionhenry', followers: 15000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-07-21T10:00:00Z', url: 'https://www.linkedin.com/in/bjionhenry' },
  { id: 'li-6', platform: 'linkedin', name: 'David Soule', handle: 'davidsoule2', followers: 12000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-07-21T10:00:00Z', url: 'https://www.linkedin.com/in/davidsoule2' },
  { id: 'li-7', platform: 'linkedin', name: 'Noah Dueck', handle: 'noah-dueck', followers: 8000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-07-21T10:00:00Z', url: 'https://www.linkedin.com/in/noah-dueck-9776bb307' },
  { id: 'li-8', platform: 'linkedin', name: 'Diego Mayor', handle: 'diego-mayor', followers: 11000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-07-21T10:00:00Z', url: 'https://www.linkedin.com/in/diego-mayor-a47a40235' },
  { id: 'li-9', platform: 'linkedin', name: 'Ruben Scholtz', handle: 'ruben-scholtz', followers: 9000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-07-21T10:00:00Z', url: 'https://www.linkedin.com/in/ruben-scholtz-ai-marketing-sales-automation' },
  { id: 'li-10', platform: 'linkedin', name: 'Manish Mandot', handle: 'manish-mandot', followers: 7500, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-07-21T10:00:00Z', url: 'https://www.linkedin.com/in/manish-mandot' },
  { id: 'li-11', platform: 'linkedin', name: 'Eugene Kadzin', handle: 'eugene-kadzin', followers: 14000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-07-21T10:00:00Z', url: 'https://www.linkedin.com/in/eugene-kadzin-13a209177' },
  { id: 'li-12', platform: 'linkedin', name: 'Ben Van Sprundel', handle: 'benvansprundel', followers: 52000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-07-21T10:00:00Z', url: 'https://www.linkedin.com/in/benvansprundel' },
  { id: 'li-13', platform: 'linkedin', name: 'Riccardo Vandra', handle: 'riccardovandra', followers: 67000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-07-21T10:00:00Z', url: 'https://www.linkedin.com/in/riccardovandra' },
  { id: 'li-14', platform: 'linkedin', name: 'Ivar Pavlovich', handle: 'ivar-pavlovich', followers: 6000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-07-21T10:00:00Z', url: 'https://www.linkedin.com/in/ivar-pavlovich' },
  { id: 'li-15', platform: 'linkedin', name: 'Seb Gardner', handle: 'seb-gardner', followers: 5500, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-07-21T10:00:00Z', url: 'https://www.linkedin.com/in/seb-gardner-5b439a260' },
  { id: 'li-16', platform: 'linkedin', name: 'Michel Lieben', handle: 'michel-lieben', followers: 8500, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-07-21T10:00:00Z', url: 'https://www.linkedin.com/in/michel-lieben' },
  { id: 'li-17', platform: 'linkedin', name: 'Liam Ottley', handle: 'liamottley', followers: 156000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-07-21T10:00:00Z', url: 'https://www.linkedin.com/in/liamottley' },
  { id: 'li-18', platform: 'linkedin', name: 'Akant Jas', handle: 'akantjas', followers: 4500, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-07-21T10:00:00Z', url: 'https://www.linkedin.com/in/akantjas' },
  { id: 'li-19', platform: 'linkedin', name: 'GTM Engineer', handle: 'gtm-engineer', followers: 12000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-07-21T10:00:00Z', url: 'https://www.linkedin.com/in/gtm-engineer' },
  { id: 'li-20', platform: 'linkedin', name: 'Dan Rosenthal', handle: 'dan-rosenthal', followers: 7000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-07-21T10:00:00Z', url: 'https://www.linkedin.com/in/dan-rosenthal-7a216a195' },
  { id: 'li-21', platform: 'linkedin', name: 'AJ Green', handle: 'aj-green-ai', followers: 9500, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-07-21T10:00:00Z', url: 'https://www.linkedin.com/in/aj-green-ai' },
  { id: 'li-22', platform: 'linkedin', name: 'Niklas Götz', handle: 'niklas-goetz', followers: 6500, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-07-21T10:00:00Z', url: 'https://www.linkedin.com/in/niklas-götz' },
  { id: 'li-23', platform: 'linkedin', name: 'Afnan M', handle: 'afnanm', followers: 5000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-07-21T10:00:00Z', url: 'https://www.linkedin.com/in/afnanm' },
  { id: 'li-24', platform: 'linkedin', name: 'Wigerstedt', handle: 'wigerstedt', followers: 4000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-07-21T10:00:00Z', url: 'https://www.linkedin.com/in/wigerstedt' },
  { id: 'li-25', platform: 'linkedin', name: 'Brock Mesarich', handle: 'brockmesarich', followers: 8000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-07-21T10:00:00Z', url: 'https://www.linkedin.com/in/brockmesarich' },
  { id: 'li-26', platform: 'linkedin', name: 'Syed Hussain', handle: 'syed-hussain', followers: 3500, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-07-21T10:00:00Z', url: 'https://www.linkedin.com/in/syed-hussain-9893772a4' },
  { id: 'li-27', platform: 'linkedin', name: 'Nadezhda Privalikhina', handle: 'nadezhda-privalikhina', followers: 6000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-07-21T10:00:00Z', url: 'https://www.linkedin.com/in/nadezhda-privalikhina' },
  { id: 'li-28', platform: 'linkedin', name: 'Alessio Monte', handle: 'alessiomonte', followers: 11000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-07-21T10:00:00Z', url: 'https://www.linkedin.com/in/alessiomonte/' },
  { id: 'li-29', platform: 'linkedin', name: 'Sasch Thetasch', handle: 'saschthetasch', followers: 7500, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-07-21T10:00:00Z', url: 'https://www.linkedin.com/in/saschthetasch/' },
  { id: 'li-30', platform: 'linkedin', name: 'Lukas Brugger', handle: 'bruggerlukas', followers: 23000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-11-06T10:00:00Z', url: 'https://www.linkedin.com/in/bruggerlukas' },
  { id: 'li-31', platform: 'linkedin', name: 'Jonas Nagler', handle: 'jonasnagler', followers: 18000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-11-06T10:00:00Z', url: 'https://www.linkedin.com/in/jonasnagler' },
  { id: 'li-32', platform: 'linkedin', name: 'Robin Luehrig', handle: 'robinluehrig', followers: 9000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-07-21T10:00:00Z', url: 'https://www.linkedin.com/in/robinluehrig' },
  { id: 'li-33', platform: 'linkedin', name: 'Niklas Bechtel', handle: 'niklas-bechtel', followers: 14000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-07-21T10:00:00Z', url: 'https://linkedin.com/in/niklas-bechtel-2090532b7' },
  { id: 'li-34', platform: 'linkedin', name: 'Ghiles MS', handle: 'ghiles-moussaoui', followers: 41000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-07-21T10:00:00Z', url: 'https://www.linkedin.com/in/ghiles-moussaoui-b36218250/' },
  { id: 'li-35', platform: 'linkedin', name: 'Mio', handle: 'miode', followers: 5500, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-07-21T10:00:00Z', url: 'https://www.linkedin.com/in/miode/' },
  { id: 'li-36', platform: 'linkedin', name: 'Matt Gray', handle: 'mattgray1', followers: 245000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-07-21T10:00:00Z', url: 'https://www.linkedin.com/in/mattgray1/' },
  { id: 'li-37', platform: 'linkedin', name: 'Manthan Patel', handle: 'leadgenmanthan', followers: 8000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-07-21T10:00:00Z', url: 'https://www.linkedin.com/in/leadgenmanthan/' },
  { id: 'li-38', platform: 'linkedin', name: 'Thorsten Netzel', handle: 'torsten-nezel', followers: 4500, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-07-21T10:00:00Z', url: 'https://www.linkedin.com/in/torsten-nezel-5b0b52256/' },
  { id: 'li-39', platform: 'linkedin', name: 'Jan Arend Heidemann', handle: 'jan-arend-heideman', followers: 3500, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-07-21T10:00:00Z', url: 'https://www.linkedin.com/in/jan-arend-heideman-💍✨-13a6681a6/' },
  { id: 'li-40', platform: 'linkedin', name: 'Gleb Gordeev', handle: 'glebgordeev', followers: 6000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-07-21T10:00:00Z', url: 'https://www.linkedin.com/in/glebgordeev/' },
  { id: 'li-41', platform: 'linkedin', name: 'Franz Merz', handle: 'franz-merz', followers: 7500, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-07-21T10:00:00Z', url: 'https://www.linkedin.com/in/franz-merz/' },
  { id: 'li-42', platform: 'linkedin', name: 'Chris Marrano', handle: 'christophermarrano', followers: 38000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-07-21T10:00:00Z', url: 'https://www.linkedin.com/in/christophermarrano/' },
  { id: 'li-43', platform: 'linkedin', name: 'Ruben Hassid', handle: 'ruben-hassid', followers: 125000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-07-21T10:00:00Z', url: 'https://www.linkedin.com/in/ruben-hassid/' },
  { id: 'li-44', platform: 'linkedin', name: 'Raphael Yarish', handle: 'raphaelyarish', followers: 18000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-07-21T10:00:00Z', url: 'https://www.linkedin.com/in/raphaelyarish/' },
  { id: 'li-45', platform: 'linkedin', name: 'Caleb Kruse', handle: 'calebkrusemedia', followers: 29000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-07-21T10:00:00Z', url: 'https://www.linkedin.com/in/calebkrusemedia/' },
  { id: 'li-46', platform: 'linkedin', name: 'Mike Futia', handle: 'mike-futia', followers: 34000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-07-21T10:00:00Z', url: 'https://www.linkedin.com/in/mike-futia-108709126/' },
  { id: 'li-47', platform: 'linkedin', name: 'Jim Schroën', handle: 'jimschroen', followers: 11000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-07-21T10:00:00Z', url: 'https://www.linkedin.com/in/jimschroen/' },
  { id: 'li-48', platform: 'linkedin', name: 'Alex Fedotoff', handle: 'alex-fedotoff', followers: 45000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-07-21T10:00:00Z', url: 'https://www.linkedin.com/in/alex-fedotoff/' },
  { id: 'li-49', platform: 'linkedin', name: 'Aryan Mahajan', handle: 'aryanmahajaninstig8', followers: 8500, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-07-21T10:00:00Z', url: 'https://www.linkedin.com/in/aryanmahajaninstig8/' },
  { id: 'li-50', platform: 'linkedin', name: 'Eugenio Zabell', handle: 'eugenio-zabell', followers: 6500, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-07-21T10:00:00Z', url: 'https://www.linkedin.com/in/eugenio-zabell/' },
  { id: 'li-51', platform: 'linkedin', name: 'Daniel Setzermann', handle: 'danielsetzermann', followers: 19000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-11-06T10:00:00Z', url: 'https://www.linkedin.com/in/danielsetzermann/' },
  { id: 'li-52', platform: 'linkedin', name: 'Viktoria Rode', handle: 'viktoriarode', followers: 12000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-07-22T10:00:00Z', url: 'https://www.linkedin.com/in/viktoriarode/' },
  { id: 'li-53', platform: 'linkedin', name: 'Johannes Kliesch', handle: 'johannes-kliesch', followers: 85000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-11-06T10:00:00Z', url: 'https://www.linkedin.com/in/johannes-kliesch/' },
  { id: 'li-54', platform: 'linkedin', name: 'Robert W. Schönholz', handle: 'robert-schoenholz', followers: 12000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: undefined, url: 'https://www.linkedin.com/in/robert-w-schönholz-87b07210b/' },
  { id: 'li-55', platform: 'linkedin', name: 'Harald Roine', handle: 'haraldroine', followers: 35000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: undefined, url: 'https://www.linkedin.com/in/haraldroine/' },
  { id: 'li-56', platform: 'linkedin', name: 'Ibharat Soni', handle: 'ibharatsoni', followers: 7500, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: undefined, url: 'https://www.linkedin.com/in/ibharatsoni/' },
  { id: 'li-57', platform: 'linkedin', name: 'Julius Kopp', handle: 'juliuskopp', followers: 9000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: undefined, url: 'https://www.linkedin.com/in/juliuskopp/' },
  { id: 'li-58', platform: 'linkedin', name: 'Eric Jansen', handle: 'eric-jansen', followers: 5500, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: undefined, url: 'https://www.linkedin.com/in/eric-jansen-bbbb201ab/' },
  { id: 'li-59', platform: 'linkedin', name: 'Adriaan Dekker', handle: 'adriaan-dekker', followers: 15000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-11-06T10:00:00Z', url: 'https://www.linkedin.com/in/adriaan-dekker-google-ads-freelancer-rotterdam/' },
  { id: 'li-60', platform: 'linkedin', name: 'Toby Waller', handle: 'tobyjwaller', followers: 8000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: undefined, url: 'https://www.linkedin.com/in/tobyjwaller/' },
  { id: 'li-61', platform: 'linkedin', name: 'Christoph Dahn', handle: 'christophdahn', followers: 6500, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: undefined, url: 'https://www.linkedin.com/in/christophdahn/' },
  { id: 'li-62', platform: 'linkedin', name: 'Alen Kevljanin', handle: 'alen-kevljanin', followers: 4500, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: undefined, url: 'https://www.linkedin.com/in/alen-kevljanin-518169200/' },
  { id: 'li-63', platform: 'linkedin', name: 'Rehan Choudhry', handle: 'rehan-choudhry', followers: 3500, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: undefined, url: 'https://www.linkedin.com/in/rehan-choudhry-/' },
  { id: 'li-64', platform: 'linkedin', name: 'Philipp Jahnke', handle: 'philip-jahnke', followers: 4000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: undefined, url: 'https://www.linkedin.com/in/philip-jahnke-2b26a1155/' },
  { id: 'li-65', platform: 'linkedin', name: 'Anina Kistner', handle: 'aninakistner', followers: 5500, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: undefined, url: 'https://www.linkedin.com/in/aninakistner/' },
  { id: 'li-66', platform: 'linkedin', name: 'Ana Rita Lopes', handle: 'anaritaml', followers: 6000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: undefined, url: 'https://www.linkedin.com/in/anaritaml/' },
  { id: 'li-67', platform: 'linkedin', name: 'Mert Durucan', handle: 'mert-durucan', followers: 3000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: undefined, url: 'https://www.linkedin.com/in/mert-durucan-26b740191/' },
  { id: 'li-68', platform: 'linkedin', name: 'Matteo Rossi', handle: 'matteo-rossi', followers: 4500, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: undefined, url: 'https://www.linkedin.com/in/matteo-rossi-635b8510b/' },
  { id: 'li-69', platform: 'linkedin', name: 'Sophia Knade', handle: 'sophiaknade', followers: 7000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: undefined, url: 'https://www.linkedin.com/in/sophiaknade/' },
  { id: 'li-70', platform: 'linkedin', name: 'Ece Dokumcu Taskin', handle: 'ece-dokumcu-taskin', followers: 5000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: undefined, url: 'https://www.linkedin.com/in/ece-dokumcu-taskin/' },
  { id: 'li-71', platform: 'linkedin', name: 'Alessandro Grassano', handle: 'alessandro-grassano', followers: 4500, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: undefined, url: 'https://www.linkedin.com/in/alessandro-grassano/' },
  { id: 'li-72', platform: 'linkedin', name: 'Catherine Körting', handle: 'catherine-koerting', followers: 8500, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: undefined, url: 'https://www.linkedin.com/in/catherine-körting-66521422/' },
  { id: 'li-73', platform: 'linkedin', name: 'Bosco Puig', handle: 'bosco-garcia-puig', followers: 6000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: undefined, url: 'https://www.linkedin.com/in/bosco-garcía-puig-a9817342' },
  { id: 'li-74', platform: 'linkedin', name: 'Florian Diez', handle: 'florian-diez', followers: 5500, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: undefined, url: 'https://www.linkedin.com/in/florian-diez/' },
  { id: 'li-75', platform: 'linkedin', name: 'Florian Bein', handle: 'florian-bein', followers: 4000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: undefined, url: 'https://www.linkedin.com/in/florian-bein/' },
  { id: 'li-76', platform: 'linkedin', name: 'Robin Doerrmann', handle: 'robin-doerrmann', followers: 3500, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: undefined, url: 'http://www.linkedin.com/in/robin-dörrmann-8a4578196' },

  // ===================== YOUTUBE PROFILES (35) =====================
  { id: 'yt-1', platform: 'youtube', name: 'Nate Herkelman', handle: '@nateherk', followers: 125000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-12-27T10:00:00Z', url: 'https://www.youtube.com/@nateherk' },
  { id: 'yt-2', platform: 'youtube', name: 'Michele Torti', handle: '@michtortiyt', followers: 89000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-12-16T10:00:00Z', url: 'https://www.youtube.com/@michtortiyt' },
  { id: 'yt-3', platform: 'youtube', name: 'Nickolas Saraev', handle: '@nicksaraev', followers: 267000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-12-16T10:00:00Z', url: 'https://www.youtube.com/@nicksaraev' },
  { id: 'yt-4', platform: 'youtube', name: 'Diego Mayor', handle: '@diegomayorba', followers: 45000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-12-16T10:00:00Z', url: 'https://www.youtube.com/@diegomayorba' },
  { id: 'yt-5', platform: 'youtube', name: 'Eugene Kadzin', handle: '@eugenekadzin', followers: 78000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-12-16T10:00:00Z', url: 'https://www.youtube.com/@eugenekadzin' },
  { id: 'yt-6', platform: 'youtube', name: 'Ben Van Sprundel', handle: '@BenAI92', followers: 156000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-12-27T10:00:00Z', url: 'https://www.youtube.com/@BenAI92' },
  { id: 'yt-7', platform: 'youtube', name: 'Riccardo Vandra', handle: '@riccardovandra', followers: 134000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-12-16T10:00:00Z', url: 'https://www.youtube.com/@riccardovandra' },
  { id: 'yt-8', platform: 'youtube', name: 'Liam Ottley', handle: '@LiamOttley', followers: 423000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-12-27T10:00:00Z', url: 'https://www.youtube.com/@LiamOttley' },
  { id: 'yt-9', platform: 'youtube', name: 'Niklas Bechtel', handle: '@Niklas_AI', followers: 67000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-12-16T10:00:00Z', url: 'https://www.youtube.com/@Niklas_AI' },
  { id: 'yt-10', platform: 'youtube', name: 'Arnold Oberleiter', handle: '@Arnold-Oberleiter', followers: 34000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-12-27T10:00:00Z', url: 'https://www.youtube.com/@Arnold-Oberleiter' },
  { id: 'yt-11', platform: 'youtube', name: 'Sebastian Claes', handle: '@claes-work', followers: 28000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-12-27T10:00:00Z', url: 'https://www.youtube.com/@claes-work' },
  { id: 'yt-12', platform: 'youtube', name: 'Jack Roberts', handle: '@Itssssss_Jack', followers: 52000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-12-27T10:00:00Z', url: 'https://www.youtube.com/@Itssssss_Jack' },
  { id: 'yt-13', platform: 'youtube', name: 'Kia Ghasem', handle: '@kiaghasem', followers: 89000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-12-16T10:00:00Z', url: 'https://youtube.com/@kiaghasem' },
  { id: 'yt-14', platform: 'youtube', name: 'Fabio Bergmann', handle: '@fabio-bergmann', followers: 45000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-12-27T10:00:00Z', url: 'https://youtube.com/@fabio-bergmann' },
  { id: 'yt-15', platform: 'youtube', name: 'Nicklas Hansen', handle: '@niklas.hansen', followers: 67000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-12-16T10:00:00Z', url: 'https://youtube.com/@niklas.hansen' },
  { id: 'yt-16', platform: 'youtube', name: 'Chris Marrano', handle: '@ChrisMarrano', followers: 112000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-12-16T10:00:00Z', url: 'https://www.youtube.com/@ChrisMarrano' },
  { id: 'yt-17', platform: 'youtube', name: 'Adrian Viral AI Marketing', handle: '@AdrianViralAIMarketing', followers: 78000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-12-27T10:00:00Z', url: 'https://www.youtube.com/@AdrianViralAIMarketing' },
  { id: 'yt-18', platform: 'youtube', name: 'Sebastien Jefferies', handle: '@SebastienJefferies', followers: 156000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-12-27T10:00:00Z', url: 'https://www.youtube.com/@SebastienJefferies' },
  { id: 'yt-19', platform: 'youtube', name: 'Dan Kieft', handle: '@Dankieft', followers: 89000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-12-16T10:00:00Z', url: 'https://www.youtube.com/@Dankieft' },
  { id: 'yt-20', platform: 'youtube', name: 'Rourke Sefton-Minns', handle: '@RourkeHeath', followers: 67000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-12-27T10:00:00Z', url: 'https://www.youtube.com/@RourkeHeath' },
  { id: 'yt-21', platform: 'youtube', name: 'Ricardo Taipe', handle: '@ricardotaipe', followers: 45000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-12-16T10:00:00Z', url: 'https://www.youtube.com/@ricardotaipe' },
  { id: 'yt-22', platform: 'youtube', name: 'Adrian AI / AI Agents', handle: '@adrian.aiagents', followers: 34000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-12-27T10:00:00Z', url: 'https://www.youtube.com/@adrian.aiagents' },
  { id: 'yt-23', platform: 'youtube', name: 'RoboNuggets', handle: '@RoboNuggets', followers: 89000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-12-27T10:00:00Z', url: 'https://www.youtube.com/@RoboNuggets' },
  { id: 'yt-24', platform: 'youtube', name: 'Everlast AI', handle: '@everlastai', followers: 56000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2026-01-08T10:00:00Z', url: 'https://www.youtube.com/@everlastai' },
  { id: 'yt-25', platform: 'youtube', name: 'Youri van Hofwegen', handle: '@Yourivanhofwegen', followers: 23000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-08-29T10:00:00Z', url: 'https://www.youtube.com/@Yourivanhofwegen' },
  { id: 'yt-26', platform: 'youtube', name: 'Sirio Berati', handle: '@SirioBerati', followers: 78000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-12-27T10:00:00Z', url: 'https://www.youtube.com/@SirioBerati' },
  { id: 'yt-27', platform: 'youtube', name: 'Johannes Kliesch', handle: '@johanneskliesch', followers: 123000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-12-27T10:00:00Z', url: 'https://www.youtube.com/@johanneskliesch' },
  { id: 'yt-28', platform: 'youtube', name: 'Alen Kevljanin', handle: '@alenkevljanin', followers: 34000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-12-27T10:00:00Z', url: 'https://www.youtube.com/@alenkevljanin' },
  { id: 'yt-29', platform: 'youtube', name: 'The AI Automators', handle: '@TheAIAutomators', followers: 67000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-12-16T10:00:00Z', url: 'https://www.youtube.com/@TheAIAutomators' },
  { id: 'yt-30', platform: 'youtube', name: 'DGI Kaos', handle: '@DGIKaos', followers: 45000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-12-27T10:00:00Z', url: 'https://www.youtube.com/watch?v=SMAaksR_1qg' },
  { id: 'yt-31', platform: 'youtube', name: 'Weavy.ai', handle: '@Weavy-ai', followers: 23000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-12-27T10:00:00Z', url: 'https://www.youtube.com/@Weavy-ai' },
  { id: 'yt-32', platform: 'youtube', name: 'Alex Hormozi', handle: '@AlexHormozi', followers: 3200000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-12-27T10:00:00Z', url: 'https://www.youtube.com/@AlexHormozi' },
  { id: 'yt-33', platform: 'youtube', name: 'Think Media', handle: '@ThinkMediaTV', followers: 2800000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2025-12-29T10:00:00Z', url: 'https://www.youtube.com/@ThinkMediaTV' },
  { id: 'yt-34', platform: 'youtube', name: 'OBRosewell', handle: '@OBRosewell', followers: 156000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2026-01-01T10:00:00Z', url: 'https://www.youtube.com/@OBRosewell/videos' },
  { id: 'yt-35', platform: 'youtube', name: 'Philip Epping', handle: '@philippeppingsales', followers: 34000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2026-01-13T10:00:00Z', url: 'https://youtube.com/@philippeppingsales' },
  { id: 'yt-36', platform: 'youtube', name: 'Matt Larsen', handle: '@mattlarsen1000x', followers: 45000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2026-01-20T10:00:00Z', url: 'https://www.youtube.com/@mattlarsen1000x' },

  // ===================== INSTAGRAM PROFILES (7) =====================
  { id: 'ig-1', platform: 'instagram', name: 'Nickolas Saraev', handle: '@nick_saraev', followers: 156000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2026-01-14T10:00:00Z', url: 'https://www.instagram.com/nick_saraev/' },
  { id: 'ig-2', platform: 'instagram', name: 'Sebastien Jefferies', handle: '@sebastienjefferies', followers: 89000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2026-01-12T10:00:00Z', url: 'https://www.instagram.com/sebastienjefferies/' },
  { id: 'ig-3', platform: 'instagram', name: 'Rourke Sefton-Minns', handle: '@rourkeheath', followers: 45000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: undefined, url: 'https://www.instagram.com/rourkeheath' },
  { id: 'ig-4', platform: 'instagram', name: 'bywaviboy', handle: '@bywaviboy', followers: 234000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2026-01-13T10:00:00Z', url: 'https://www.instagram.com/bywaviboy/' },
  { id: 'ig-5', platform: 'instagram', name: 'Pjacefilms', handle: '@pjacefilms', followers: 178000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2026-01-12T10:00:00Z', url: 'https://www.instagram.com/pjacefilms/' },
  { id: 'ig-6', platform: 'instagram', name: 'Herspace', handle: '@herspace.munich', followers: 67000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: '2026-01-20T10:00:00Z', url: 'https://www.instagram.com/herspace.munich/' },
  { id: 'ig-7', platform: 'instagram', name: 'Fabiabengs', handle: '@fabiabengs', followers: 45000, addedAt: '2025-01-01T10:00:00Z', lastScrapedAt: undefined, url: 'https://www.instagram.com/fabiabengs/' }
]

// Mock Tracked Content
export const MOCK_TRACKED_CONTENT: TrackedContent[] = [
  {
    id: 'tc-1',
    profileId: 'yt-8',
    platform: 'youtube',
    status: 'new',
    title: 'How to Build AI Agents That Actually Work',
    content: 'In this video I break down the exact framework for building AI agents...',
    url: 'https://youtube.com/watch?v=abc123',
    publishedAt: '2025-12-20T10:00:00Z',
    scrapedAt: '2025-12-27T10:00:00Z',
    metrics: {
      views: 450000,
      likes: 23000,
      comments: 1200
    }
  },
  {
    id: 'tc-2',
    profileId: 'yt-3',
    platform: 'youtube',
    status: 'repurpose',
    title: 'The $100K/Month AI Automation Blueprint',
    content: 'My complete system for scaling AI automation services...',
    url: 'https://youtube.com/watch?v=def456',
    publishedAt: '2025-12-15T10:00:00Z',
    scrapedAt: '2025-12-16T10:00:00Z',
    metrics: {
      views: 890000,
      likes: 45000,
      comments: 2300
    },
    notes: 'Gute Idee für LinkedIn-Post!'
  },
  {
    id: 'tc-3',
    profileId: 'ig-1',
    platform: 'instagram',
    status: 'new',
    content: 'AI won\'t replace you. Someone using AI will. Start learning now. 🚀',
    url: 'https://instagram.com/p/xyz789',
    publishedAt: '2026-01-10T08:00:00Z',
    scrapedAt: '2026-01-14T10:00:00Z',
    metrics: {
      likes: 156000,
      comments: 3400
    }
  },
  {
    id: 'tc-4',
    profileId: 'li-7',
    platform: 'linkedin',
    status: 'backlog',
    content: 'I spent 2 years building AI automation agencies. Here\'s what I learned...\n\n1. Consistency beats intensity\n2. Your network is your net worth\n3. Ship fast, iterate faster',
    url: 'https://linkedin.com/posts/liamottley-123',
    publishedAt: '2025-07-16T09:00:00Z',
    scrapedAt: '2025-07-21T10:00:00Z',
    metrics: {
      views: 89000,
      likes: 2300,
      comments: 156
    }
  },
  {
    id: 'tc-5',
    profileId: 'yt-30',
    platform: 'youtube',
    status: 'new',
    title: 'How I Built a $100M Business',
    content: 'The complete breakdown of building Gym Launch and Acquisition.com...',
    url: 'https://youtube.com/watch?v=hormozi123',
    publishedAt: '2025-12-22T10:00:00Z',
    scrapedAt: '2025-12-27T10:00:00Z',
    metrics: {
      views: 2500000,
      likes: 125000,
      comments: 8900
    }
  },
  {
    id: 'tc-6',
    profileId: 'ig-4',
    platform: 'instagram',
    status: 'new',
    content: 'POV: You finally understand how to use AI for content creation 🎬',
    url: 'https://instagram.com/p/waviboy123',
    publishedAt: '2026-01-12T08:00:00Z',
    scrapedAt: '2026-01-13T10:00:00Z',
    metrics: {
      likes: 89000,
      comments: 1200
    }
  },
  {
    id: 'tc-7',
    profileId: 'li-11',
    platform: 'linkedin',
    status: 'repurpose',
    content: 'The 5 systems every solopreneur needs:\n\n1. Content system\n2. Sales system\n3. Delivery system\n4. Finance system\n5. Growth system\n\nMaster these, scale anything.',
    url: 'https://linkedin.com/posts/mattgray-456',
    publishedAt: '2025-07-18T09:00:00Z',
    scrapedAt: '2025-07-21T10:00:00Z',
    metrics: {
      views: 245000,
      likes: 8900,
      comments: 567
    },
    notes: 'Super Format - adaptieren für AI Automation!'
  }
]

// Mock Dashboard Stats
export const MOCK_DASHBOARD_STATS: DashboardStats = {
  totalPosts: 156,
  postsThisWeek: 8,
  scheduledPosts: 5,
  totalImpressions: 1245000,
  avgEngagement: 3.2,
  platformBreakdown: [
    { platform: 'linkedin', posts: 78, engagement: 4.5 },
    { platform: 'youtube', posts: 24, engagement: 2.8 },
    { platform: 'instagram', posts: 45, engagement: 3.1 },
    { platform: 'skool', posts: 9, engagement: 5.2 }
  ]
}

// Mock Analytics Chart Data
export const MOCK_CHART_DATA = [
  { date: '2024-01-01', impressions: 12000, engagement: 450 },
  { date: '2024-01-02', impressions: 15000, engagement: 520 },
  { date: '2024-01-03', impressions: 18000, engagement: 680 },
  { date: '2024-01-04', impressions: 14000, engagement: 490 },
  { date: '2024-01-05', impressions: 22000, engagement: 890 },
  { date: '2024-01-06', impressions: 19000, engagement: 720 },
  { date: '2024-01-07', impressions: 25000, engagement: 950 },
  { date: '2024-01-08', impressions: 21000, engagement: 780 },
  { date: '2024-01-09', impressions: 28000, engagement: 1100 },
  { date: '2024-01-10', impressions: 32000, engagement: 1250 },
  { date: '2024-01-11', impressions: 27000, engagement: 980 },
  { date: '2024-01-12', impressions: 35000, engagement: 1400 },
  { date: '2024-01-13', impressions: 29000, engagement: 1050 },
  { date: '2024-01-14', impressions: 38000, engagement: 1520 }
]

// Helper to get posts by platform
export const getPostsByPlatform = (platform: string): Post[] => {
  return MOCK_POSTS.filter(post => post.platform === platform)
}

// Helper to get posts by status
export const getPostsByStatus = (status: string): Post[] => {
  return MOCK_POSTS.filter(post => post.status === status)
}

// Helper to get tracked content by profile
export const getTrackedContentByProfile = (profileId: string): TrackedContent[] => {
  return MOCK_TRACKED_CONTENT.filter(content => content.profileId === profileId)
}

// Helper to get tracked profiles by platform
export const getTrackedProfilesByPlatform = (platform: string): TrackedProfile[] => {
  return MOCK_TRACKED_PROFILES.filter(profile => profile.platform === platform)
}
