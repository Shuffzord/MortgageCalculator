import app from './app';
import { config } from './config/environment';
import { logger } from './utils/logger';

const PORT = config.PORT || 3001;

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});