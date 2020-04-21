import { getDate, getMonth, getYear } from 'date-fns';

const formatDate = (date: Date): string => {
  const parsedDate = `${getDate(date)}/${getMonth(date)}/${getYear(date)}`;

  return parsedDate;
};

export default formatDate;
