package fm.cassette.app;

import android.app.Dialog;
import android.content.DialogInterface;
import android.graphics.Bitmap;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "YouTubeAuth")
public class YouTubeAuthPlugin extends Plugin {

    private Dialog authDialog = null;

    @PluginMethod
    public void login(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            try {
                CookieManager cookieManager = CookieManager.getInstance();
                cookieManager.setAcceptCookie(true);

                FrameLayout container = new FrameLayout(getContext());
                container.setLayoutParams(new ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                ));

                WebView webView = new WebView(getContext());
                webView.setLayoutParams(new FrameLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                ));

                WebSettings settings = webView.getSettings();
                settings.setJavaScriptEnabled(true);
                settings.setDomStorageEnabled(true);
                settings.setDatabaseEnabled(true);
                // Standard Android Chrome Mobile User-Agent to avoid Google's "disallowed useragent" check
                settings.setUserAgentString("Mozilla/5.0 (Linux; Android 14; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36");

                cookieManager.setAcceptThirdPartyCookies(webView, true);
                container.addView(webView);

                authDialog = new Dialog(getActivity(), android.R.style.Theme_Black_NoTitleBar_Fullscreen);
                authDialog.setContentView(container);
                authDialog.setCancelable(true);

                authDialog.setOnCancelListener(new DialogInterface.OnCancelListener() {
                    @Override
                    public void onCancel(DialogInterface dialog) {
                        call.reject("Login cancelled by user");
                    }
                });

                webView.setWebViewClient(new WebViewClient() {
                    private boolean resolved = false;

                    @Override
                    public void onPageStarted(WebView view, String url, Bitmap favicon) {
                        super.onPageStarted(view, url, favicon);
                        checkSession(url);
                    }

                    @Override
                    public void onPageFinished(WebView view, String url) {
                        super.onPageFinished(view, url);
                        checkSession(url);
                    }

                    @Override
                    public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                        String url = request.getUrl().toString();
                        if (checkSession(url)) {
                            return true;
                        }
                        return false;
                    }

                    private synchronized boolean checkSession(String url) {
                        if (resolved) return true;
                        if (url == null) return false;

                        // Check if we reached YouTube / YouTube Music with authentication cookies
                        if (url.contains("music.youtube.com") || url.contains("youtube.com")) {
                            String cookies = cookieManager.getCookie("https://music.youtube.com");
                            if (cookies == null || cookies.isEmpty()) {
                                cookies = cookieManager.getCookie("https://youtube.com");
                            }

                            if (cookies != null && (cookies.contains("SAPISID") || cookies.contains("__Secure-3PAPISID") || cookies.contains("LOGIN_INFO") || cookies.contains("SID="))) {
                                resolved = true;
                                if (authDialog != null && authDialog.isShowing()) {
                                    authDialog.dismiss();
                                    authDialog = null;
                                }

                                JSObject ret = new JSObject();
                                ret.put("cookie", cookies);
                                ret.put("success", true);
                                call.resolve(ret);
                                return true;
                            }
                        }
                        return false;
                    }
                });

                // Open Google Service Login targeting YouTube Music
                webView.loadUrl("https://accounts.google.com/ServiceLogin?continue=https%3A%2F%2Fmusic.youtube.com");
                authDialog.show();

            } catch (Exception e) {
                call.reject("Failed to open login dialog: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void getSavedCookie(PluginCall call) {
        CookieManager cookieManager = CookieManager.getInstance();
        String cookies = cookieManager.getCookie("https://music.youtube.com");
        if (cookies == null || cookies.isEmpty()) {
            cookies = cookieManager.getCookie("https://youtube.com");
        }

        boolean isLoggedIn = cookies != null && (cookies.contains("SAPISID") || cookies.contains("__Secure-3PAPISID") || cookies.contains("LOGIN_INFO") || cookies.contains("SID="));

        JSObject ret = new JSObject();
        ret.put("cookie", cookies != null ? cookies : "");
        ret.put("isLoggedIn", isLoggedIn);
        call.resolve(ret);
    }

    @PluginMethod
    public void logout(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            try {
                CookieManager cookieManager = CookieManager.getInstance();
                cookieManager.removeAllCookies(value -> {
                    cookieManager.flush();
                    JSObject ret = new JSObject();
                    ret.put("success", true);
                    call.resolve(ret);
                });
            } catch (Exception e) {
                call.reject("Failed to logout: " + e.getMessage());
            }
        });
    }
}
