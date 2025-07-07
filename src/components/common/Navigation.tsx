import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CreditScoreIcon from '@mui/icons-material/CreditScore';
import HomeIcon from '@mui/icons-material/Home';
import MenuIcon from '@mui/icons-material/Menu';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
  AppBar,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { useWallet } from '../../contexts/wallet';
import { toCompactAddress } from '../../utils/formatter';

const Navigation: React.FC = () => {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { connected, walletAddress, connect, disconnect } = useWallet();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);

  const handleConnect = async () => {
    await connect(() => {});
  };

  const handleUserMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleDisconnect = () => {
    disconnect();
    handleUserMenuClose();
  };

  const navigationItems = [
    { path: '/', label: 'Home', icon: <HomeIcon /> },
    { path: '/ai-optimizer', label: 'AI Optimizer', icon: <SmartToyIcon /> },
    { path: '/credit-score', label: 'Credit Score', icon: <CreditScoreIcon /> },
    { path: '/function', label: 'Supply & Borrow', icon: <TrendingUpIcon /> },
    { path: '/userinfo', label: 'User Dashboard', icon: <AccountBalanceIcon /> },
    { path: '/repayFunction', label: 'Repay & Withdraw', icon: <AssessmentIcon /> },
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
    setMobileMenuOpen(false);
  };

  const MobileDrawer = () => (
    <Drawer anchor="left" open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)}>
      <Box sx={{ width: 250 }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" color="primary">
            Blend Protocol
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enhanced DeFi Experience
          </Typography>
        </Box>
        <Divider />
        <List>
          {navigationItems.map((item) => (
            <ListItem
              button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              selected={router.pathname === item.path}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItem>
          ))}
        </List>
        <Divider />
        <Box sx={{ p: 2 }}>
          {connected ? (
            <Button variant="outlined" color="secondary" onClick={handleDisconnect} fullWidth>
              Disconnect
            </Button>
          ) : (
            <Button variant="contained" color="primary" onClick={handleConnect} fullWidth>
              Connect Wallet
            </Button>
          )}
        </Box>
      </Box>
    </Drawer>
  );

  return (
    <>
      <AppBar position="sticky">
        <Toolbar>
          {isMobile && (
            <IconButton color="inherit" onClick={() => setMobileMenuOpen(true)} sx={{ mr: 2 }}>
              <MenuIcon />
            </IconButton>
          )}

          <Typography
            variant="h6"
            sx={{ flexGrow: 1, cursor: 'pointer' }}
            onClick={() => handleNavigation('/')}
          >
            <SmartToyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Blend Protocol
          </Typography>

          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 1, mr: 2 }}>
              {navigationItems.slice(1).map((item) => (
                <Button
                  key={item.path}
                  color="inherit"
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    textTransform: 'none',
                    color: router.pathname === item.path ? 'primary.main' : 'inherit',
                    borderBottom: router.pathname === item.path ? '2px solid' : 'none',
                    borderRadius: 0,
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          )}

          {connected ? (
            <>
              <Chip
                icon={<AccountCircleIcon />}
                label={toCompactAddress(walletAddress)}
                color="secondary"
                variant="outlined"
                onClick={handleUserMenuClick}
                sx={{ color: 'white', borderColor: 'white' }}
              />
              <Menu
                anchorEl={userMenuAnchor}
                open={Boolean(userMenuAnchor)}
                onClose={handleUserMenuClose}
              >
                <MenuItem
                  onClick={() => {
                    handleNavigation('/userinfo');
                    handleUserMenuClose();
                  }}
                >
                  <AccountBalanceIcon sx={{ mr: 1 }} />
                  Dashboard
                </MenuItem>
                <MenuItem onClick={handleDisconnect}>Disconnect</MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              color="inherit"
              variant="outlined"
              onClick={handleConnect}
              sx={{ borderColor: 'white', color: 'white' }}
            >
              Connect Wallet
            </Button>
          )}
        </Toolbar>
      </AppBar>

      {isMobile && <MobileDrawer />}
    </>
  );
};

export default Navigation;
