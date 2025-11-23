# Netlify Deployment Guide

## Environment Variables Required

Add these environment variables in Netlify Dashboard → Site settings → Environment variables:

### Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Anthropic API
```
ANTHROPIC_API_KEY=your-anthropic-api-key
```

### App Configuration
```
NEXT_PUBLIC_APP_URL=https://your-netlify-site.netlify.app
```

## Build Settings

The project includes a `netlify.toml` configuration file with the following settings:

- **Build command**: `npm run build`
- **Publish directory**: `.next`
- **Node version**: 20
- **Plugin**: @netlify/plugin-nextjs

## Troubleshooting

If build fails:
1. Ensure all environment variables are set in Netlify dashboard
2. Check that Node version is set to 20
3. Verify that the @netlify/plugin-nextjs plugin is enabled
4. Review build logs for specific errors

## Post-Deployment

After successful deployment:
1. Test authentication flow
2. Verify Supabase connection
3. Test AI proposal generation
4. Check file uploads
