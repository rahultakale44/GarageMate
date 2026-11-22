package com.garagemate.api.common;

import lombok.Builder;
import lombok.Getter;
import org.springframework.data.domain.Page;

import java.util.List;

@Getter
@Builder
public class PagedResponse<T> {

    private final boolean success;
    private final List<T> data;
    private final PaginationMeta pagination;

    @Getter
    @Builder
    public static class PaginationMeta {
        private final int page;
        private final int limit;
        private final long total;
        private final int pages;
    }

    public static <T> PagedResponse<T> from(Page<T> page, int pageNumber, int pageSize) {
        return PagedResponse.<T>builder()
                .success(true)
                .data(page.getContent())
                .pagination(PaginationMeta.builder()
                        .page(pageNumber)
                        .limit(pageSize)
                        .total(page.getTotalElements())
                        .pages(page.getTotalPages())
                        .build())
                .build();
    }
}
