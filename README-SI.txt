SACHI-MD-PANEL — FULL STARTER PACKAGE

මෙහි files:
- index.html: dashboard UI (Status, Start/Deploy, Restart, Stop, Logs section)
- index.js: වෙනම backend API
- package.json: npm start
- .gitignore: secrets / dependencies GitHub එකට යාම වැළැක්වීම

වැදගත්:
මෙය starter package එකකි. Railway API token/IDs නිවැරදිව configure කරලා deploy කර test කරන තුරු controls වැඩ කරන බව තහවුරු නොවේ.
Logs endpoint එක Railway deployment logs සඳහා query එකක් භාවිතා කරයි; account/schema permissions අනුව එය test කරන්න. CPU/RAM metrics සහ file manager ද තවම implement කර නැත. UI එක ඒවා unavailable ලෙස පෙන්වයි.
Start / Deploy action එක Railway service එකට අලුත් deployment එකක් trigger කිරීමට අදහස් කරයි; stopped deployment එකක් resume කරන එකම අර්ථය නොවේ.

DEPLOY:
1. ZIP එක extract කරන්න.
2. මේ files bot repository/service එකට දාන්න එපා. Panel API සඳහා වෙනම GitHub repository එකක් හෝ වෙනම Railway service source එකක් භාවිතා කරන්න.
3. Backend source එක deploy කර Start Command = npm start ලෙස සකසන්න.
4. Backend Railway service එකේ Variables තුළ පමණක් පහත values set කරන්න:
   PANEL_PASSWORD = දිගු, අනුමාන කළ නොහැකි password එකක්
   RAILWAY_API_TOKEN = Railway API token
   RAILWAY_PROJECT_ID = target service තියෙන project ID
   RAILWAY_SERVICE_ID = පාලනය කළ යුතු service ID
   RAILWAY_ENVIRONMENT_ID = target environment ID
   ALLOWED_ORIGINS = GitHub Pages URL එක, උදා: https://username.github.io (හෝ custom domain එක)
5. Backend service එකට public domain generate කර /health open කරන්න. {"ok":true} පෙනිය යුතුයි.
6. Panel website එක open කර backend URL සහ PANEL_PASSWORD ඇතුළත් කර Connect / Refresh ඔබන්න.

ආරක්ෂාව:
- API token එක HTML, GitHub, screenshot, chat කිසිම තැනක share කරන්න එපා.
- Password එකත් chat එකට එවන්න එපා.
- Project/Service/Environment IDs නිවැරදිද කියලා තහවුරු කරලා පමණක් controls test කරන්න.
- API token එකට අවම අවශ්‍ය permissions පමණක් දෙන්න.
- Public domain එකක් තිබුණා කියලා backend secure/configured වෙලා තියෙනවා කියන එක නෙවෙයි.
