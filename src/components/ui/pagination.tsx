import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

// Utility function for className (if using NativeWind, otherwise ignore or map manually)
const cn = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' ');

// Simple Button component equivalent (mimicking buttonVariants)
interface ButtonProps {
  variant?: 'ghost' | 'outline';
  size?: 'icon' | 'default';
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

function Button({ variant = 'ghost', size = 'icon', children, onPress, disabled, style, ...props }: ButtonProps) {
  const buttonStyle = StyleSheet.flatten([
    styles.button,
    variant === 'outline' && styles.outline,
    size === 'default' && styles.defaultSize,
    disabled && styles.disabled,
    style,
  ]);

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
}

interface PaginationProps {
  className?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

function Pagination({ className, children, style, ...props }: PaginationProps) {
  const paginationStyle = StyleSheet.flatten([styles.pagination, style]);

  return (
    <View
      style={paginationStyle}
      {...props}
    >
      {children}
    </View>
  );
}

interface PaginationContentProps {
  className?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

function PaginationContent({ className, children, style, ...props }: PaginationContentProps) {
  const contentStyle = StyleSheet.flatten([styles.content, style]);

  return (
    <View style={contentStyle} {...props}>
      {children}
    </View>
  );
}

interface PaginationItemProps {
  children: React.ReactNode;
}

function PaginationItem({ children, ...props }: PaginationItemProps) {
  return <View {...props}>{children}</View>;
}

interface PaginationLinkProps {
  isActive?: boolean;
  size?: 'icon' | 'default';
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean; 
  className?: string;
  style?: ViewStyle;
}

function PaginationLink({
  className,
  isActive,
  size = 'icon',
  children,
  onPress,
  disabled = false, 
  style,
  ...props
}: PaginationLinkProps) {

  const linkStyle = StyleSheet.flatten([ 
    styles.link,
    isActive && styles.linkActive, 
    disabled && styles.linkDisabled, 
    style,
  ]);

  return (
    <TouchableOpacity
      style={linkStyle}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
}

interface PaginationPreviousProps {
  className?: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

function PaginationPrevious({ className, onPress, disabled = false, style, ...props }: PaginationPreviousProps) {
  
  const previousStyle = StyleSheet.flatten([styles.previous, style])
  return (
    <PaginationLink
      size="default"
      style={previousStyle}
      onPress={onPress}
      disabled={disabled}
      {...props}
    >
      <ChevronLeftIcon size={16} color="#374151" />
      <Text style={styles.previousText}>Previous</Text>
    </PaginationLink>
  );
}

interface PaginationNextProps {
  className?: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

function PaginationNext({ className, onPress, disabled = false, style, ...props }: PaginationNextProps) {
  
  const nextStyle = StyleSheet.flatten([styles.next, style])
  
  return (
    <PaginationLink
      size="default"
      style={nextStyle}
      onPress={onPress}
      disabled={disabled}
      {...props}
    >
      <Text style={styles.nextText}>Next</Text>
      <ChevronRightIcon size={16} color="#374151" />
    </PaginationLink>
  );
}

interface PaginationEllipsisProps {
  className?: string;
  style?: ViewStyle;
}

function PaginationEllipsis({ className, style, ...props }: PaginationEllipsisProps) {
  const ellipsisStyle = StyleSheet.flatten([styles.ellipsis, style]);

  return (
    <View
      style={ellipsisStyle}
      {...props}
    >
      <MoreHorizontalIcon size={16} color="#6b7280" />
      {/* Texto acessível removido pois não é necessário em React Native */}
    </View>
  );
}

// Componente completo de paginação para facilitar o uso
interface CompletePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showNumbers?: boolean;
  showArrows?: boolean;
  style?: ViewStyle;
}

function CompletePagination({
  currentPage,
  totalPages,
  onPageChange,
  showNumbers = true,
  showArrows = true,
  style,
}: CompletePaginationProps) {
  if (totalPages <= 1) return null;

  const getVisiblePages = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const visiblePages = getVisiblePages();
  const paginationStyle = StyleSheet.flatten([styles.completePagination, style]);

  return (
    <Pagination style={paginationStyle}>
      <PaginationContent>
        {/* Botão anterior */}
        {showArrows && (
          <PaginationItem>
            <PaginationPrevious
              onPress={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            />
          </PaginationItem>
        )}

        {/* Números das páginas */}
        {showNumbers && visiblePages.map((page, index) => {
          if (page === '...') {
            return (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            );
          }

          const pageNumber = page as number;
          const isActive = pageNumber === currentPage;

          return (
            <PaginationItem key={pageNumber}>
              <PaginationLink
                isActive={isActive}
                onPress={() => onPageChange(pageNumber)}
              >
                <Text style={[
                  styles.linkText,
                  isActive && styles.linkTextActive,
                ]}>
                  {pageNumber}
                </Text>
              </PaginationLink>
            </PaginationItem>
          );
        })}

        {/* Botão próximo */}
        {showArrows && (
          <PaginationItem>
            <PaginationNext
              onPress={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            />
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
}

const styles = StyleSheet.create({
  pagination: {
    alignSelf: 'center',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  completePagination: {
    marginVertical: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    padding: 8,
    backgroundColor: 'transparent',
  },
  outline: {
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  defaultSize: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  disabled: {
    opacity: 0.5,
  },
  link: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    padding: 8,
    minWidth: 36,
    height: 36,
    backgroundColor: 'transparent',
  },
  linkActive: { 
    backgroundColor: '#3b82f6',
  },
  linkDisabled: { 
    opacity: 0.5,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  linkTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  previous: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
  },
  previousText: {
    fontSize: 14,
    color: '#374151',
  },
  next: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
  },
  nextText: {
    fontSize: 14,
    color: '#374151',
  },
  ellipsis: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export {
  Button, CompletePagination, Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
};
