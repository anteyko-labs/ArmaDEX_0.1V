# 🚀 GitHub Repository Setup - ArmaDEX

## ✅ Remote URL Updated

Remote URL has been changed to:
```
https://github.com/anteyko-labs/ArmaDEX.git
```

## 📋 Steps to Create and Push Repository

### 1. Create Repository on GitHub

1. Go to: **https://github.com/organizations/anteyko-labs/repositories/new**
   - Or: https://github.com/new (if logged in as anteyko-labs)

2. Fill in the form:
   - **Repository name**: `ArmaDEX`
   - **Description**: `MEV-Protected Trading Platform - Decentralized Exchange`
   - **Visibility**: Choose Public or Private
   - **⚠️ IMPORTANT**: 
     - ❌ Do NOT check "Add a README file"
     - ❌ Do NOT check "Add .gitignore"
     - ❌ Do NOT check "Choose a license"
   - Click **"Create repository"**

### 2. Push Your Code

After creating the repository, run these commands:

```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "Rename TradeShield to ArmaDEX and prepare for deployment

- Renamed all TradeShield references to ArmaDEX
- Updated branding across frontend
- Added Vercel deployment configuration
- Fixed duplicate methods in services
- Added WalletConnect integration
- Updated project name in package.json"

# Push to new repository
git push -u origin main
```

### 3. Verify

Check that your code is on GitHub:
- Visit: **https://github.com/anteyko-labs/ArmaDEX**

## 🔗 Connect to Vercel

After pushing to GitHub:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import from GitHub: **anteyko-labs/ArmaDEX**
4. Vercel will auto-detect Vite settings
5. Add environment variables (see DEPLOY.md)
6. Click **"Deploy"**

## 📝 Current Changes Summary

- ✅ Renamed TradeShield → ArmaDEX
- ✅ Updated all UI components
- ✅ Updated package.json
- ✅ Added Vercel configuration
- ✅ Fixed build errors
- ✅ Added WalletConnect support

## 🆘 Troubleshooting

### Error: "repository not found"
- Make sure you created the repository on GitHub first
- Check that you have access to anteyko-labs organization

### Error: "authentication failed"
```bash
# Update credentials
git config --global user.name "anteyko-labs"
git config --global user.email "labs@anteyko.com"
```

### Error: "remote origin already exists"
Already handled - remote URL has been updated.

