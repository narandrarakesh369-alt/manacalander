package in.manacalendar.app;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.GeolocationPermissions;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.InputStream;
import java.io.IOException;

public class MainActivity extends Activity {
    private WebView webView;
    private static final String APP_HOST = "manacalendar.in";
    private static final String APP_URL = "https://" + APP_HOST + "/";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        webView.setBackgroundColor(Color.parseColor("#F8FAFC"));
        setContentView(webView, new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setGeolocationEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                callback.invoke(origin, true, false);
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (uri != null && uri.getHost() != null &&
                    (uri.getHost().equalsIgnoreCase(APP_HOST) || uri.getHost().equalsIgnoreCase("localhost"))) {
                    String path = uri.getPath();
                    if (path == null || path.isEmpty() || path.equals("/")) {
                        path = "/index.html";
                    }

                    // Remove leading slash for asset lookup
                    String cleanPath = path.startsWith("/") ? path.substring(1) : path;
                    String assetPath = "dist/" + cleanPath;

                    try {
                        InputStream is;
                        try {
                            is = getAssets().open(assetPath);
                        } catch (IOException notFound) {
                            // Single Page Application (SPA) routing fallback
                            assetPath = "dist/index.html";
                            is = getAssets().open(assetPath);
                        }

                        String mimeType = getMimeType(assetPath);
                        return new WebResourceResponse(mimeType, "UTF-8", is);
                    } catch (IOException e) {
                        return null;
                    }
                }
                return super.shouldInterceptRequest(view, request);
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (uri != null && uri.getHost() != null && uri.getHost().equalsIgnoreCase(APP_HOST)) {
                    return false; // Handled internally
                }
                if (uri != null && "manacalendar".equalsIgnoreCase(uri.getScheme())) {
                    String forwardUrl = "https://" + APP_HOST + uri.getPath();
                    view.loadUrl(forwardUrl);
                    return true;
                }
                // Open external links in device browser
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                    startActivity(intent);
                    return true;
                } catch (Exception e) {
                    return false;
                }
            }
        });

        handleIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIntent(intent);
    }

    private void handleIntent(Intent intent) {
        if (intent != null && intent.getData() != null) {
            Uri data = intent.getData();
            if ("manacalendar".equalsIgnoreCase(data.getScheme())) {
                String targetPath = data.getPath() != null ? data.getPath() : "";
                webView.loadUrl("https://" + APP_HOST + targetPath);
                return;
            } else if (data.getHost() != null && data.getHost().equalsIgnoreCase(APP_HOST)) {
                webView.loadUrl(data.toString());
                return;
            }
        }
        webView.loadUrl(APP_URL);
    }

    private String getMimeType(String path) {
        if (path.endsWith(".html")) return "text/html";
        if (path.endsWith(".js") || path.endsWith(".mjs")) return "application/javascript";
        if (path.endsWith(".css")) return "text/css";
        if (path.endsWith(".json")) return "application/json";
        if (path.endsWith(".png")) return "image/png";
        if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
        if (path.endsWith(".svg")) return "image/svg+xml";
        if (path.endsWith(".ico")) return "image/x-icon";
        if (path.endsWith(".woff2")) return "font/woff2";
        if (path.endsWith(".woff")) return "font/woff";
        if (path.endsWith(".ttf")) return "font/ttf";
        return "application/octet-stream";
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
            webView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }
}
