import { OAuth2Client } from 'google-auth-library';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_SCOPES, ALLOWED_EMAILS, EMAIL_TO_CAREER_MAP } from '../config/authConfig';
import { shell, BrowserWindow } from 'electron';
import log from 'electron-log';
import http from 'http';
import url from 'url';
import { AddressInfo } from 'net';

export async function startGoogleLogin() {
    return new Promise((resolve, reject) => {
        const server = http.createServer(async (req, res) => {
            try {
                if (!req.url) return;
                const reqUrl = url.parse(req.url, true);

                if (reqUrl.pathname === '/callback') {
                    const code = reqUrl.query.code as string;

                    if (code) {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end('<h1>Login exitoso!</h1><p>Puedes cerrar esta pestaña y volver a la aplicación.</p><script>window.close()</script>');
                        server.close();

                        // Process the code
                        try {
                            const address = server.address();
                            // If server is closed, address might be null, but we need the port we utilized. 
                            // Actually, we should capture port in the closure scope when listening.
                        } catch (e) { /* ignore */ }
                    }
                }
            } catch (error) {
                log.error('Error in auth server:', error);
            }
        });

        // Store port in a variable accessible to the handler closure if needed, 
        // or just pass it in the callback url.
        // Better: Define the logic inside listen callback and move handler logic there or allow handler to access "redirectUri" variable.

        const AUTH_PORT = 3000;
        // El servidor ya fue creado arriba en la línea 11

        server.on('error', (err: any) => {
            if (err.code === 'EADDRINUSE') {
                log.error(`Port ${AUTH_PORT} is in use. Check for other instances of the app or services.`);
                BrowserWindow.getAllWindows().forEach(win => {
                    win.webContents.send('auth:google-callback-result', { 
                        success: false, 
                        error: `El puerto ${AUTH_PORT} está ocupado por otra aplicación. Por favor, ciérrala e intenta de nuevo.` 
                    });
                });
                reject(new Error(`Port ${AUTH_PORT} busy`));
            }
        });

        server.listen(AUTH_PORT, 'localhost', async () => {
            const redirectUri = `http://localhost:${AUTH_PORT}/callback`;

            // Update the request handler to use this redirectUri
            server.removeAllListeners('request');
            server.on('request', async (req, res) => {
                try {
                    if (!req.url) return;
                    const reqUrl = url.parse(req.url, true);

                    if (reqUrl.pathname === '/callback') {
                        const code = reqUrl.query.code as string;

                        if (code) {
                            res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
                            res.end('<h1>Login exitoso!</h1><p>Puedes cerrar esta pestaña y volver a la aplicación.</p><script>window.close()</script>');
                            server.close();

                            // Process the code
                            try {
                                const { user, tokens } = await handleCode(code, redirectUri);

                                // Send result to all windows (or the main one if we had specific ref)
                                BrowserWindow.getAllWindows().forEach(win => {
                                    win.webContents.send('auth:google-callback-result', { success: true, user, tokens });
                                });
                                resolve(user);
                            } catch (err: any) {
                                log.error('Error processing code:', err);
                                BrowserWindow.getAllWindows().forEach(win => {
                                    win.webContents.send('auth:google-callback-result', { success: false, error: err.message });
                                });
                                reject(err);
                            }
                        }
                    }
                } catch (error) {
                    log.error('Error in auth server request handling:', error);
                }
            });

            const client = new OAuth2Client(
                GOOGLE_CLIENT_ID,
                GOOGLE_CLIENT_SECRET,
                redirectUri
            );

            const authorizeUrl = client.generateAuthUrl({
                access_type: 'offline',
                scope: GOOGLE_SCOPES,
                prompt: 'consent'
            });

            log.info(`Opening Google Login URL with redirect: ${redirectUri}`);
            await shell.openExternal(authorizeUrl);
        });
    });
}

async function handleCode(code: string, redirectUri: string) {
    const client = new OAuth2Client(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        redirectUri
    );

    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    // Fetch user profile
    const ticket = await client.verifyIdToken({
        idToken: tokens.id_token!,
        audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
        throw new Error('Could not verify user profile');
    }

    // Check Whitelist - Disabled for general sharing
    // if (!ALLOWED_EMAILS.includes(payload.email)) {
    //    throw new Error(`Email ${payload.email} is not authorized.`);
    // }

    // Determine Career
    const lowerEmail = payload.email.toLowerCase();
    // Default to iaev if not mapped (User requested preference)
    const careerId = EMAIL_TO_CAREER_MAP[lowerEmail] || 'iaev';

    return {
        user: {
            googleId: payload.sub,
            username: payload.email.split('@')[0], // Add username
            email: payload.email,
            name: payload.name || 'Usuario', // Ensure name is string
            picture: payload.picture,
            careerId: careerId, // Set dynamic career
            tokens
        },
        tokens
    };
}

// Deprecated or unused for this flow, but kept for reference if needed
export async function handleGoogleCallback(url: string) {
    // ... custom protocol logic if ever needed
}

export async function refreshGoogleTokens(refreshToken: string) {
    const client = new OAuth2Client(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET
    );

    client.setCredentials({
        refresh_token: refreshToken
    });

    try {
        const { credentials } = await client.refreshAccessToken();

        // Verify identity to return consistent user object
        const ticket = await client.verifyIdToken({
            idToken: credentials.id_token!,
            audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();

        if (!payload || !payload.email) {
            throw new Error('Could not verify user profile on refresh');
        }

        const lowerEmail = payload.email.toLowerCase();
        const careerId = EMAIL_TO_CAREER_MAP[lowerEmail] || 'iaev';

        return {
            user: {
                googleId: payload.sub,
                username: payload.email.split('@')[0],
                email: payload.email,
                name: payload.name || 'Usuario',
                picture: payload.picture,
                careerId: careerId,
                tokens: credentials
            },
            tokens: credentials
        };
    } catch (error) {
        log.error('Error refreshing tokens:', error);
        throw error;
    }
}
