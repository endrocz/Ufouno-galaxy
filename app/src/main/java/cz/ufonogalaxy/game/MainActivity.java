package cz.ufonogalaxy.game;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import android.content.Intent;
import android.net.Uri;

public class MainActivity extends Activity {
    private WebView web;
    private PermissionRequest pending;
    private static final int AUDIO_REQUEST=101;
    @Override public void onCreate(Bundle b) {
        super.onCreate(b);
        web=new WebView(this);
        setContentView(web);
        WebSettings s=web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        // Required only so the packaged offline page can access its user-configured HTTPS API.
        s.setAllowUniversalAccessFromFileURLs(true);
        web.setWebChromeClient(new WebChromeClient(){
            @Override public void onPermissionRequest(PermissionRequest request){
                runOnUiThread(()->{
                    if(request.getOrigin()==null || !request.getOrigin().toString().startsWith("file://")) { request.deny(); return; }
                    boolean audio=false;
                    for(String resource:request.getResources()) if(PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource)) audio=true;
                    if(!audio){request.deny();return;}
                    pending=request;
                    if(checkSelfPermission(Manifest.permission.RECORD_AUDIO)==PackageManager.PERMISSION_GRANTED)grantAudio();
                    else requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO},AUDIO_REQUEST);
                });
            }
        });
        web.setWebViewClient(new WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request){
                Uri u=request.getUrl();
                if("file".equals(u.getScheme())) return false;
                if("https".equals(u.getScheme())){startActivity(new Intent(Intent.ACTION_VIEW,u));return true;}
                return true;
            }
        });
        web.loadUrl("file:///android_asset/index.html");
    }
    private void grantAudio(){if(pending!=null){pending.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});pending=null;}}
    @Override public void onRequestPermissionsResult(int requestCode,String[] permissions,int[] grants){
        super.onRequestPermissionsResult(requestCode,permissions,grants);
        if(requestCode==AUDIO_REQUEST){if(grants.length>0&&grants[0]==PackageManager.PERMISSION_GRANTED)grantAudio();else if(pending!=null){pending.deny();pending=null;}}
    }
    @Override public void onBackPressed(){if(web!=null&&web.canGoBack())web.goBack();else super.onBackPressed();}
    @Override protected void onDestroy(){if(web!=null){web.destroy();web=null;}super.onDestroy();}
}
